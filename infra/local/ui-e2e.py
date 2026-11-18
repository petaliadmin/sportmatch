"""Test d'interface de bout en bout (Playwright) sur l'environnement local démarré.

Parcours : espace Bêta live → terrains à proximité → connexion Keycloak (PKCE) → création d'un match
→ chat du match en temps réel : un message envoyé hors de l'interface arrive par WebSocket.
Usage : python3 infra/local/ui-e2e.py   (pip install playwright && playwright install chromium)
"""
import asyncio
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

from playwright.async_api import async_playwright, expect

WEB = os.environ.get("WEB", "http://localhost:3000")
GATEWAY = os.environ.get("GATEWAY", "http://localhost:8080")
KEYCLOAK = os.environ.get("KEYCLOAK", "http://localhost:8180")
SHOTS = os.environ.get("SHOTS", "ui-e2e-screens")


def http(method, url, token=None, body=None, form=None):
    data, headers = None, {}
    if form is not None:
        data = urllib.parse.urlencode(form).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers, method=method), timeout=15) as r:
        return json.loads(r.read() or b"null")


def token_for(user):
    return http("POST", f"{KEYCLOAK}/realms/sportmatch/protocol/openid-connect/token",
                form={"grant_type": "password", "client_id": "sportmatch-web", "username": user, "password": "demo1234"})["access_token"]


def step(msg):
    print(f"▶ {msg}", flush=True)


async def main():
    os.makedirs(SHOTS, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        try:
            step("1. Espace Bêta live et terrains à proximité (PostGIS)")
            await page.goto(f"{WEB}/#live")
            await expect(page.get_by_text("Arena Almadies Five")).to_be_visible(timeout=20000)

            step("2. Connexion Keycloak (OIDC + PKCE)")
            await page.get_by_role("button", name="Se connecter").first.click()
            await page.locator("#username").fill("awa.player")
            await page.locator("#password").fill("demo1234")
            await page.locator("#kc-login").click()
            await expect(page.get_by_text("Awa Ndiaye")).to_be_visible(timeout=20000)

            step("3. Création d'un match depuis l'interface")
            await page.get_by_role("tab", name="Matchs").click()
            await page.get_by_role("button", name="Créer un match").click()
            await page.get_by_role("button", name="Publier le match").click()
            await expect(page.get_by_text("Organisé par toi").first).to_be_visible(timeout=15000)

            step("4. Chat du match : connexion WebSocket temps réel")
            card = page.get_by_text("Organisé par toi").first.locator("xpath=ancestor::div[contains(@class,'p-4')][1]")
            await card.get_by_role("button", name="Chat du match").click()
            await expect(page.get_by_text("Temps réel")).to_be_visible(timeout=40000)

            step("5. Message envoyé hors de l'interface → reçu instantanément par WebSocket")
            awa = token_for("awa.player")
            me = json.loads(__import__("base64").urlsafe_b64decode(awa.split(".")[1] + "==="))["sub"]
            mine = [m for m in http("GET", f"{GATEWAY}/api/v1/matches?status=OPEN", token=awa) if m["organizerId"] == me]
            conv = None
            for _ in range(20):
                try:
                    conv = http("GET", f"{GATEWAY}/api/v1/chat/conversations/by-match/{mine[0]['id']}", token=awa)["conversationId"]
                    break
                except urllib.error.HTTPError:
                    await asyncio.sleep(1.5)
            assert conv, "Conversation du match introuvable"
            text = "Message temps réel depuis le test UI"
            http("POST", f"{GATEWAY}/api/v1/chat/conversations/{conv}/messages", token=awa, body={"body": text})
            await expect(page.get_by_text(text)).to_be_visible(timeout=10000)

            step("6. Envoi depuis l'interface")
            await page.get_by_label("Message").fill("Rendez-vous 18h45 devant l'entrée")
            await page.get_by_role("button", name="Envoyer").click()
            await expect(page.get_by_text("Rendez-vous 18h45 devant l'entrée")).to_be_visible(timeout=10000)
            await page.screenshot(path=f"{SHOTS}/chat.png")

            if errors:
                raise AssertionError(f"Erreurs JavaScript : {errors}")
            print("✅ Interface validée : connexion PKCE, données réelles, chat WebSocket.", flush=True)
        except Exception:
            await page.screenshot(path=f"{SHOTS}/failure.png")
            raise
        finally:
            await browser.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"✗ {e}", file=sys.stderr)
        sys.exit(1)
