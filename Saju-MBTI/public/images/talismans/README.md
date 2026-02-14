# Talisman Images Directory

This directory contains talisman images for the 80 Destiny Characters.

## Image Naming Convention

Images should be named using the format: `{MBTI}_{Element}.png`

Examples:
- `INTJ_목.png`
- `ENFP_화.png`
- `ISFJ_토.png`
- `ESTP_금.png`
- `INFP_수.png`

## Required Images (80 total)

### MBTI Types (16):
INTJ, INTP, ENTJ, ENTP, INFJ, INFP, ENFJ, ENFP,
ISTJ, ISFJ, ESTJ, ESFJ, ISTP, ISFP, ESTP, ESFP

### Elements (5):
목 (Wood), 화 (Fire), 토 (Earth), 금 (Metal), 수 (Water)

### Total Combinations: 16 × 5 = 80 images

## Image Specifications

- **Format**: PNG with transparency
- **Recommended Size**: 400×600px
- **Orientation**: Portrait
- **Style**: Traditional Korean talisman design with modern elements
- **Content**: Should include:
  - Character emoji or illustration
  - MBTI type
  - Element symbol (木/火/土/金/水)
  - Character name
  - Decorative traditional patterns

## Placeholder

If an image is missing, the system will automatically generate an SVG placeholder with:
- Element-colored gradient background
- Gold decorative borders
- Character emoji
- MBTI and element information
- Traditional Korean aesthetic

## Adding Images

1. Create or obtain talisman images following the specifications above
2. Name them using the convention: `{MBTI}_{Element}.png`
3. Place them in this directory
4. The app will automatically use PNG images when available, falling back to SVG if not found

## Note

Currently, the directory contains only this README. All 80 talisman images need to be added for full functionality. Until then, the SVG generator will create placeholder talismans.
