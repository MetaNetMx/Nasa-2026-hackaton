#!/bin/sh
# Master a rendered draft for the web: two-pass loudness normalisation to -14 LUFS, true peak <= -1.5 dBTP.
# The video stream is copied untouched.  Usage: scripts/master.sh out/DraftA-DataInMotion.mp4 renders/DraftA.mp4
set -e
in="$1"; out="$2"
m=$(ffmpeg -hide_banner -i "$in" -af loudnorm=I=-14:TP=-1.5:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
v() { echo "$m" | sed -n "s/.*\"$1\" : \"\(.*\)\".*/\1/p"; }
ffmpeg -v error -y -i "$in" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=9:measured_I=$(v input_i):measured_TP=$(v input_tp):measured_LRA=$(v input_lra):measured_thresh=$(v input_thresh):offset=$(v target_offset):linear=true,aresample=48000" -c:a aac -b:a 256k "$out"
ffmpeg -hide_banner -i "$out" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tr -s ' '
