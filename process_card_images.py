#!/usr/bin/env python3
"""
Yu-Gi-Oh Card Image Processor
Removes white backgrounds and trims excess whitespace from card images.
"""

import os
from PIL import Image, ImageOps
import numpy as np
from pathlib import Path

def process_card_image(input_path, output_path, white_threshold=230, margin=2):
    """
    Process a single card image: remove white background and trim.
    
    Args:
        input_path: Path to input JPG file
        output_path: Path to output PNG file
        white_threshold: Threshold for considering pixels as white (0-255)
        margin: Pixels to keep around the card after trimming
    """
    try:
        # Open the image
        img = Image.open(input_path)
        img = img.convert('RGBA')
        
        # Convert to numpy array for easier processing
        data = np.array(img)
        
        # Create mask for white pixels (considering all RGB channels)
        # A pixel is considered white if all RGB values are above the threshold
        white_mask = (data[:, :, 0] >= white_threshold) & \
                     (data[:, :, 1] >= white_threshold) & \
                     (data[:, :, 2] >= white_threshold)
        
        # Set white pixels to transparent
        data[white_mask] = [255, 255, 255, 0]  # RGBA with alpha=0 for transparency
        
        # Convert back to PIL Image
        processed_img = Image.fromarray(data, 'RGBA')
        
        # Find bounding box of non-transparent content
        # Get the alpha channel
        alpha = processed_img.split()[-1]
        bbox = alpha.getbbox()
        
        if bbox:
            # Add margin but ensure we don't go outside image bounds
            left = max(0, bbox[0] - margin)
            top = max(0, bbox[1] - margin)
            right = min(processed_img.width, bbox[2] + margin)
            bottom = min(processed_img.height, bbox[3] + margin)
            
            # Crop the image
            processed_img = processed_img.crop((left, top, right, bottom))
        
        # Save as PNG with transparency
        processed_img.save(output_path, 'PNG', optimize=True)
        return True
        
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return False

def main():
    """Main processing function"""
    
    # Set up paths
    script_dir = Path(__file__).parent
    card_image_dir = script_dir / "public" / "card_image"
    
    if not card_image_dir.exists():
        print(f"Error: Card image directory not found: {card_image_dir}")
        return
    
    # Find all JPG files
    jpg_files = list(card_image_dir.glob("*.jpg"))
    
    if not jpg_files:
        print("No JPG files found in the card_image directory.")
        return
    
    print(f"Found {len(jpg_files)} JPG files to process.")
    print("Processing images...")
    
    # Process each image
    processed_count = 0
    skipped_count = 0
    failed_count = 0
    
    for jpg_file in jpg_files:
        # Create output filename (same name but .png extension)
        png_file = jpg_file.with_suffix('.png')
        
        # Skip if PNG already exists
        if png_file.exists():
            print(f"Skipping {jpg_file.name} (PNG already exists)")
            skipped_count += 1
            continue
        
        print(f"Processing {jpg_file.name}...")
        
        if process_card_image(jpg_file, png_file):
            processed_count += 1
            print(f"  → Saved as {png_file.name}")
        else:
            failed_count += 1
    
    # Summary
    print("\n" + "="*50)
    print("PROCESSING SUMMARY")
    print("="*50)
    print(f"Successfully processed: {processed_count}")
    print(f"Skipped (already exists): {skipped_count}")
    print(f"Failed: {failed_count}")
    print(f"Total files: {len(jpg_files)}")
    
    # Ask about deleting original JPG files
    if processed_count > 0:
        print("\nWould you like to delete the original JPG files?")
        response = input("Type 'yes' to delete JPG files, anything else to keep them: ").lower()
        
        if response == 'yes':
            deleted_count = 0
            for jpg_file in jpg_files:
                png_file = jpg_file.with_suffix('.png')
                if png_file.exists():
                    try:
                        jpg_file.unlink()
                        deleted_count += 1
                        print(f"Deleted {jpg_file.name}")
                    except Exception as e:
                        print(f"Failed to delete {jpg_file.name}: {e}")
            
            print(f"\nDeleted {deleted_count} JPG files.")
        else:
            print("Original JPG files have been kept.")

if __name__ == "__main__":
    main()