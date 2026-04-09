#!/usr/bin/env python
import argostranslate.package


TARGETS = {"de", "es", "pt", "fr", "it", "ru", "ar", "ja", "zh"}


def main():
    argostranslate.package.update_package_index()
    packages = argostranslate.package.get_available_packages()
    needed = []

    for package in packages:
        if (package.from_code == "pl" and package.to_code == "en") or (
            package.from_code == "en" and package.to_code in TARGETS
        ):
            needed.append(package)

    for package in needed:
        print(f"install {package.from_code}->{package.to_code}")
        download_path = package.download()
        argostranslate.package.install_from_path(download_path)


if __name__ == "__main__":
    main()
