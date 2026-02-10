---
title: New year and pkgver-sorter
description: A simple Python tool to sort checkupdates output by package version
tags: ['python', 'tool', 'pkgver-sorter', 'lang-en']
publish_date: 2026/01/19
---

During the winter break, I found some time and worked on many small projects and this new year started with many more. With AI I'm finally able to focus on small projects that I always wanted to do but never had the time to finish.

For example the other day I needed to update my Arch Linux system, I'm on Gnome and I use [arch-update](https://extensions.gnome.org/extension/1010/archlinux-updates-indicator/) extension to get notifications about updates. The extension uses the `checkupdates` command behind the scenes to get the list of updates. I noticed that the output of `checkupdates` is just sorted alphabetically by package name, which is not very useful when you have many updates available (even if not really a good practice on Arch Linux).

So I created a simple Python tool called [pkgver-sorter](https://gist.github.com/aziis98/69779039e7f58a3fe70b625577bbbbfa) that sorts the output of `checkupdates` by greatest package version update difference. In the extension settings I can now set the command to `checkupdates | pkgver-sorter` and get a much more useful output. Here is the original output of `checkupdates`:

```
ada 3.3.0-1 -> 3.4.1-1
alsa-card-profiles 1:1.4.9-2 -> 1:1.4.10-1
alsa-lib 1.2.14-2 -> 1.2.15.2-1
alsa-ucm-conf 1.2.14-2 -> 1.2.15.2-1
aom 3.13.1-1 -> 3.13.1-2
archlinux-keyring 20251116-1 -> 20260107-2
at-spi2-core 2.58.2-1 -> 2.58.3-1
attica 6.21.0-1 -> 6.22.0-1
audit 4.1.2-1 -> 4.1.2-2
...
vulkan-radeon 1:25.3.2-1 -> 1:25.3.3-2
waybar 0.14.0-5 -> 0.14.0-6
wireplumber 0.5.12-1 -> 0.5.13-1
wofi 1.5.1-1 -> 1.5.3-1
wpa_supplicant 2:2.11-3 -> 2:2.11-5
xcb-proto 1.17.0-3 -> 1.17.0-4
xorg-xauth 1.1.4-1 -> 1.1.5-1
yazi 25.5.31-2 -> 26.1.4-1
zbar 0.23.93-4 -> 0.23.93-5
```

And here is the output after piping it through `pkgver-sorter`:

```
poppler 25.12.0-1 -> 26.01.0-1
poppler-glib 25.12.0-1 -> 26.01.0-1
poppler-qt6 25.12.0-1 -> 26.01.0-1
python-fsspec 2025.12.0-1 -> 2026.1.0-1
python-certifi 2025.11.12-1 -> 2026.01.04-1
yazi 25.5.31-2 -> 26.1.4-1
ttc-iosevka 33.3.6-1 -> 34.0.0-1
chromium 143.0.7499.169-1 -> 144.0.7559.59-2
firefox 146.0.1-1 -> 147.0.1-1
tokei 13.0.0-1 -> 14.0.0-1
archlinux-keyring 20251116-1 -> 20260107-2
iana-etc 20251120-1 -> 20251215-1
sdl3 3.2.28-1 -> 3.4.0-1
libqrtr-glib 1.2.2-4 -> 1.4.0-1
...
python-pytest 1:8.4.2-1 -> 1:8.4.2-3
python-setuptools 1:80.9.0-2 -> 1:80.9.0-4
ldb 2:4.23.4-1 -> 2:4.23.4-2
libwbclient 2:4.23.4-1 -> 2:4.23.4-2
nftables 1:1.1.6-1 -> 1:1.1.6-2
smbclient 2:4.23.4-1 -> 2:4.23.4-2
tevent 1:0.17.1-1 -> 1:0.17.1-2
vulkan-headers 1:1.4.335.0-1 -> 1:1.4.335.0-2
```
