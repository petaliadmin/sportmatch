"""Applique la configuration SportMatch au projet Android généré par flutter create (idempotent)."""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent / "android" / "app"
gradle = next(p for p in [root / "build.gradle.kts", root / "build.gradle"] if p.exists())
kts = gradle.suffix == ".kts"
g = gradle.read_text()

# Identifiant d'application stable (le namespace Kotlin reste celui de flutter create)
g = re.sub(r'applicationId\s*=?\s*"[^"]+"', 'applicationId = "com.sportmatch.app"' if kts else 'applicationId "com.sportmatch.app"', g)
# flutter_secure_storage et flutter_appauth : minSdk 23
g = re.sub(r"minSdk(Version)?\s*=?\s*flutter\.minSdkVersion", "minSdk = 23" if kts else "minSdkVersion 23", g)
if "appAuthRedirectScheme" not in g:
    line = 'manifestPlaceholders["appAuthRedirectScheme"] = "com.sportmatch.app"' if kts \
        else "manifestPlaceholders += [appAuthRedirectScheme: 'com.sportmatch.app']"
    g = re.sub(r"(defaultConfig\s*\{)", r"\1\n        " + line, g, count=1)
gradle.write_text(g)

manifest = root / "src" / "main" / "AndroidManifest.xml"
m = manifest.read_text()
perms = [
    "android.permission.INTERNET",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.ACCESS_FINE_LOCATION",
]
for p in perms:
    if p not in m:
        m = m.replace("<application", f'<uses-permission android:name="{p}" />\n    <application', 1)
if "networkSecurityConfig" not in m:
    m = m.replace("<application", '<application\n        android:networkSecurityConfig="@xml/network_security_config"', 1)
m = m.replace('android:label="sportmatch_mobile"', 'android:label="SportMatch"')
manifest.write_text(m)

xml = root / "src" / "main" / "res" / "xml"
xml.mkdir(parents=True, exist_ok=True)
(xml / "network_security_config.xml").write_text("""<?xml version="1.0" encoding="utf-8"?>
<!-- HTTPS partout ; HTTP en clair toléré uniquement vers l'environnement local de développement. -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">10.0.2.2</domain>
        <domain includeSubdomains="false">localhost</domain>
        <domain includeSubdomains="false">127.0.0.1</domain>
    </domain-config>
</network-security-config>
""")
print(f"Configuré : {gradle.name}, AndroidManifest.xml, network_security_config.xml")
