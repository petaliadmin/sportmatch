"""Branche la signature de publication (android/key.properties) sur le build release (Kotlin DSL ou Groovy)."""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent / "android" / "app"
gradle = next(p for p in [root / "build.gradle.kts", root / "build.gradle"] if p.exists())
g = gradle.read_text()
if "key.properties" in g:
    raise SystemExit(0)

if gradle.suffix == ".kts":
    header = '''import java.util.Properties
import java.io.FileInputStream

val keystoreProperties = Properties().apply {
    val f = rootProject.file("key.properties")
    if (f.exists()) load(FileInputStream(f))
}
'''
    signing = '''    signingConfigs {
        create("release") {
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["keyPassword"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["storePassword"] as String
        }
    }
'''
    g = header + g
    g = re.sub(r"(\n\s*buildTypes\s*\{)", "\n" + signing + r"\1", g, count=1)
    g = g.replace('signingConfig = signingConfigs.getByName("debug")', 'signingConfig = signingConfigs.getByName("release")')
else:
    header = '''def keystoreProperties = new Properties()
def keystoreFile = rootProject.file('key.properties')
if (keystoreFile.exists()) { keystoreProperties.load(new FileInputStream(keystoreFile)) }
'''
    signing = '''    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
'''
    g = re.sub(r"(\nandroid\s*\{)", "\n" + header + r"\1", g, count=1)
    g = re.sub(r"(\n\s*buildTypes\s*\{)", "\n" + signing + r"\1", g, count=1)
    g = g.replace("signingConfig signingConfigs.debug", "signingConfig signingConfigs.release")
gradle.write_text(g)
print("Signature de publication configurée")
