#!/usr/bin/env python3
"""
Yu-Gi-Oh Card Image Reprocessor - More aggressive white removal
"""

import os
from PIL import Image, ImageOps, ImageFilter
import numpy as np
from pathlib import Path

def process_card_image_aggressive(input_path, output_path, white_threshold=220, edge_threshold=240, margin=0):
    """
    Process a single card image with more aggressive white removal.
    
    Args:
        input_path: Path to input image file
        output_path: Path to output PNG file
        white_threshold: Main threshold for white pixels (0-255)
        edge_threshold: Higher threshold for edge pixels 
        margin: Pixels to keep around the card after trimming
    """
    try:
        # Open the image
        img = Image.open(input_path)
        img = img.convert('RGBA')
        
        # Apply slight blur to handle JPEG artifacts at edges
        img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
        
        # Convert to numpy array
        data = np.array(img)
        
        # Create base mask for white pixels
        white_mask = (data[:, :, 0] >= white_threshold) & \
                     (data[:, :, 1] >= white_threshold) & \
                     (data[:, :, 2] >= white_threshold)
        
        # Create stricter mask for near-white pixels (handles gray edges)
        gray_white_mask = (data[:, :, 0] >= edge_threshold) & \
                          (data[:, :, 1] >= edge_threshold) & \
                          (data[:, :, 2] >= edge_threshold)
        
        # Also check for pixels that are close to white (all channels similar and high)
        channel_diff = np.max(data[:, :, :3], axis=2) - np.min(data[:, :, :3], axis=2)
        near_white_mask = (channel_diff < 15) & (np.mean(data[:, :, :3], axis=2) > 230)
        
        # Combine masks
        final_mask = white_mask | gray_white_mask | near_white_mask
        
        # Set masked pixels to transparent
        data[final_mask] = [255, 255, 255, 0]
        
        # Convert back to PIL Image
        processed_img = Image.fromarray(data, 'RGBA')
        
        # Apply edge cleanup - remove isolated pixels
        # Get alpha channel
        alpha = processed_img.split()[-1]
        
        # Convert alpha to numpy for processing
        alpha_data = np.array(alpha)
        
        # Remove isolated transparent pixels (cleanup)
        from scipy import ndimage
        # Create mask of opaque pixels
        opaque_mask = alpha_data > 0
        # Remove small islands of opaque pixels
        cleaned_mask = ndimage.binary_opening(opaque_mask, iterations=1)
        
        # Apply cleaned mask
        alpha_data[~cleaned_mask] = 0
        
        # Put cleaned alpha back
        alpha = Image.fromarray(alpha_data)
        processed_img.putalpha(alpha)
        
        # Find bounding box of non-transparent content
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
    
    # Find all PNG files (already processed once)
    png_files = list(card_image_dir.glob("*.png"))
    
    if not png_files:
        print("No PNG files found in the card_image directory.")
        return
    
    print(f"Found {len(png_files)} PNG files to reprocess.")
    print("Reprocessing images with more aggressive white removal...")
    
    # Process each image
    processed_count = 0
    failed_count = 0
    
    for png_file in png_files:
        print(f"Reprocessing {png_file.name}...")
        
        # Create temporary output name
        temp_file = png_file.with_suffix('.tmp.png')
        
        if process_card_image_aggressive(png_file, temp_file):
            # Replace original with processed version
            try:
                png_file.unlink()
                temp_file.rename(png_file)
                processed_count += 1
                print(f"  → Successfully reprocessed")
            except Exception as e:
                print(f"  → Failed to replace file: {e}")
                failed_count += 1
                if temp_file.exists():
                    temp_file.unlink()
        else:
            failed_count += 1
    
    # Summary
    print("\n" + "="*50)
    print("REPROCESSING SUMMARY")
    print("="*50)
    print(f"Successfully reprocessed: {processed_count}")
    print(f"Failed: {failed_count}")
    print(f"Total files: {len(png_files)}")

if __name__ == "__main__":
    main()