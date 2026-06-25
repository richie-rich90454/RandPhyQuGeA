# Generates a minimal valid 16x16 32-bit icon.ico for tauri-build.
$bytes = New-Object System.Collections.Generic.List[byte]

function Add-Bytes($list, [byte[]]$arr) { $list.AddRange($arr) }

# ICONDIR header (6 bytes)
Add-Bytes $bytes ([byte[]](0, 0))        # reserved
Add-Bytes $bytes ([byte[]](1, 0))        # type = 1 (ICO)
Add-Bytes $bytes ([byte[]](1, 0))        # count = 1

# ICONDIRENTRY (16 bytes)
$bytes.Add([byte]16)                     # width 16
$bytes.Add([byte]16)                     # height 16
$bytes.Add([byte]0)                      # color count
$bytes.Add([byte]0)                      # reserved
Add-Bytes $bytes ([byte[]](1, 0))        # planes
Add-Bytes $bytes ([byte[]](32, 0))       # bit count
$imageDataSize = 40 + 16 * 16 * 4 + 16 * 16 / 8  # 1096
Add-Bytes $bytes ([BitConverter]::GetBytes([uint32]$imageDataSize))  # bytes in res
Add-Bytes $bytes ([BitConverter]::GetBytes([uint32]22))              # image offset

# BITMAPINFOHEADER (40 bytes)
Add-Bytes $bytes ([BitConverter]::GetBytes([uint32]40))    # biSize
Add-Bytes $bytes ([BitConverter]::GetBytes([int32]16))     # biWidth
Add-Bytes $bytes ([BitConverter]::GetBytes([int32]32))     # biHeight (2x for ICO)
Add-Bytes $bytes ([byte[]](1, 0))                          # biPlanes
Add-Bytes $bytes ([byte[]](32, 0))                         # biBitCount
Add-Bytes $bytes ([BitConverter]::GetBytes([uint32]0))     # biCompression
Add-Bytes $bytes ([BitConverter]::GetBytes([uint32]1024))  # biSizeImage
Add-Bytes $bytes ([BitConverter]::GetBytes([int32]0))      # biXPelsPerMeter
Add-Bytes $bytes ([BitConverter]::GetBytes([int32]0))      # biYPelsPerMeter
Add-Bytes $bytes ([BitConverter]::GetBytes([uint32]0))     # biClrUsed
Add-Bytes $bytes ([BitConverter]::GetBytes([uint32]0))     # biClrImportant

# Pixel data: 16x16 BGRA (primary color from palette: R=40, G=90, B=180)
for ($i = 0; $i -lt (16 * 16); $i++) {
    $bytes.Add([byte]180)  # B
    $bytes.Add([byte]90)   # G
    $bytes.Add([byte]40)   # R
    $bytes.Add([byte]255)  # A
}

# AND mask: 16x16/8 = 32 bytes, all 0 (fully opaque)
for ($i = 0; $i -lt 32; $i++) { $bytes.Add([byte]0) }

$out = 'C:\Users\rjian\Desktop\RandPhyQuGeA\src-tauri\icons\icon.ico'
[System.IO.File]::WriteAllBytes($out, $bytes.ToArray())
Write-Host ("Wrote {0} bytes to {1}" -f $bytes.Count, $out)
