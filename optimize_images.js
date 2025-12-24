const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
const targetWidth = 120; // Resize to 120px width (sufficient for small icons)

async function optimizeImages() {
    console.log("Starting image optimization...");

    if (!fs.existsSync(assetsDir)) {
        console.error("Assets directory not found!");
        return;
    }

    const files = fs.readdirSync(assetsDir);

    for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            const filePath = path.join(assetsDir, file);

            try {
                const image = await Jimp.read(filePath);

                // Only resize if width is greater than target
                if (image.bitmap.width > targetWidth) {
                    console.log(`Resizing ${file} (${image.bitmap.width}px -> ${targetWidth}px)...`);

                    await image
                        .resize(targetWidth, Jimp.AUTO) // Resize width, maintain aspect ratio
                        .quality(80) // Set JPEG quality to 80% (ignored for PNG usually but good practice)
                        .writeAsync(filePath); // Overwrite existing file

                    console.log(`✅ Optimized ${file}`);
                } else {
                    console.log(`Skipping ${file} (Already small enough)`);
                }
            } catch (err) {
                console.error(`❌ Error processing ${file}:`, err.message);
            }
        }
    }
    console.log("Image optimization complete!");
}

optimizeImages();
