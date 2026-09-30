# Fontlar

Bu papkaga quyidagi font fayllarini qo'yish kerak (`.ttf` formatida):

## Playfair Display (display / serif)
- `PlayfairDisplay-Regular.ttf`
- `PlayfairDisplay-Bold.ttf`

Manba: https://fonts.google.com/specimen/Playfair+Display

## Inter (body / sans)
- `Inter-Regular.ttf`
- `Inter-Medium.ttf`
- `Inter-SemiBold.ttf`
- `Inter-Bold.ttf`

Manba: https://fonts.google.com/specimen/Inter

## Yuklab olish

Bir marta bu skriptni ishga tushiring (yoki qo'lda Google Fonts saytidan yuklab, shu papkaga tashlang):

```bash
# macOS/Linux
cd apps/mobile/assets/fonts

# Playfair Display
curl -sL https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf \
  -o PlayfairDisplay-Regular.ttf
# For Bold — you'd typically extract the static instance; simpler:
# Download the family zip from https://fonts.google.com/specimen/Playfair+Display

# Inter
curl -sL https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Regular.ttf   -o Inter-Regular.ttf
curl -sL https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Medium.ttf    -o Inter-Medium.ttf
curl -sL https://github.com/rsms/inter/raw/master/docs/font-files/Inter-SemiBold.ttf  -o Inter-SemiBold.ttf
curl -sL https://github.com/rsms/inter/raw/master/docs/font-files/Inter-Bold.ttf      -o Inter-Bold.ttf
```

**Muhim:** Fontlarsiz ilova ochilmaydi. Bu MVP setup qadamlaridan biri.
