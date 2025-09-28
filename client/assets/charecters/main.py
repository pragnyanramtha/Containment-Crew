from PIL import Image
import os

# File path
file_path = "hero.png"

# Open the sprite sheet
sprite_sheet = Image.open(file_path)

# Get dimensions
sheet_width, sheet_height = sprite_sheet.size

# Define sprite size (based on grid 5 rows x 8 columns)
cols = 8
rows = 4
sprite_width = sheet_width // cols
sprite_height = sheet_height // rows

# Create output folder
output_folder = "hero_sprites"
os.makedirs(output_folder, exist_ok=True)

# Extract and save individual sprites with meaningful names
file_names = []
for row in range(rows):
    for col in range(cols):
        left = col * sprite_width
        upper = row * sprite_height
        right = left + sprite_width
        lower = upper + sprite_height
        sprite = sprite_sheet.crop((left, upper, right, lower))

        # Name convention: hero_rowX_colY.png
        file_name = f"hero_row{row+1}_col{col+1}.png"
        file_path_out = os.path.join(output_folder, file_name)
        sprite.save(file_path_out)
        file_names.append(file_path_out)

file_names[:5]  # Show first few saved files
