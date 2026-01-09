/**
 * Icon generation script for Electron app
 * Uses Sharp to generate all required icon sizes and formats
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_ICON = path.join(__dirname, '..', 'icon.png');
const OUTPUT_DIR = path.join(__dirname, '..', 'electron', 'icons');

// Required PNG sizes for different platforms
const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

// ICO sizes (Windows)
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generatePNGs() {
  console.log('Generating PNG icons...');

  const pngDir = path.join(OUTPUT_DIR, 'png');
  await ensureDir(pngDir);

  for (const size of PNG_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `${size}x${size}.png`);
    await sharp(SOURCE_ICON)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`  Created ${size}x${size}.png`);

    // Also save to png subfolder (some tools expect this)
    const pngSubPath = path.join(pngDir, `${size}x${size}.png`);
    await sharp(SOURCE_ICON)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(pngSubPath);
  }

  // Copy 256x256 as icon.png (default for Linux)
  await sharp(SOURCE_ICON)
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'icon.png'));
  console.log('  Created icon.png (256x256)');
}

async function generateICO() {
  console.log('Generating ICO icon for Windows...');

  // Generate individual size buffers
  const images = await Promise.all(
    ICO_SIZES.map(async (size) => {
      const buffer = await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      return { size, buffer };
    })
  );

  // Build ICO file manually
  // ICO format: header + directory entries + image data
  const icoBuffer = createICO(images);

  const outputPath = path.join(OUTPUT_DIR, 'icon.ico');
  fs.writeFileSync(outputPath, icoBuffer);
  console.log('  Created icon.ico');
}

function createICO(images) {
  // ICO Header: 6 bytes
  // - 2 bytes: Reserved (0)
  // - 2 bytes: Image type (1 for ICO)
  // - 2 bytes: Number of images

  // Directory entry: 16 bytes each
  // - 1 byte: Width (0 = 256)
  // - 1 byte: Height (0 = 256)
  // - 1 byte: Color palette
  // - 1 byte: Reserved
  // - 2 bytes: Color planes
  // - 2 bytes: Bits per pixel
  // - 4 bytes: Image size
  // - 4 bytes: Image offset

  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = images.length * dirEntrySize;

  let offset = headerSize + dirSize;
  const entries = [];

  // Sort images by size (largest first for better quality)
  images.sort((a, b) => b.size - a.size);

  for (const img of images) {
    entries.push({
      width: img.size >= 256 ? 0 : img.size,
      height: img.size >= 256 ? 0 : img.size,
      buffer: img.buffer,
      offset
    });
    offset += img.buffer.length;
  }

  // Create final buffer
  const totalSize = offset;
  const buffer = Buffer.alloc(totalSize);

  // Write header
  buffer.writeUInt16LE(0, 0);           // Reserved
  buffer.writeUInt16LE(1, 2);           // Type (1 = ICO)
  buffer.writeUInt16LE(images.length, 4); // Image count

  // Write directory entries
  let dirOffset = headerSize;
  for (const entry of entries) {
    buffer.writeUInt8(entry.width, dirOffset);
    buffer.writeUInt8(entry.height, dirOffset + 1);
    buffer.writeUInt8(0, dirOffset + 2);  // Color palette
    buffer.writeUInt8(0, dirOffset + 3);  // Reserved
    buffer.writeUInt16LE(1, dirOffset + 4);  // Color planes
    buffer.writeUInt16LE(32, dirOffset + 6); // Bits per pixel
    buffer.writeUInt32LE(entry.buffer.length, dirOffset + 8);
    buffer.writeUInt32LE(entry.offset, dirOffset + 12);
    dirOffset += dirEntrySize;
  }

  // Write image data
  for (const entry of entries) {
    entry.buffer.copy(buffer, entry.offset);
  }

  return buffer;
}

async function generateICNS() {
  console.log('Generating ICNS icon for macOS...');

  // ICNS format requires specific sizes with specific type codes
  const icnsTypes = [
    { type: 'ic07', size: 128 },   // 128x128
    { type: 'ic08', size: 256 },   // 256x256
    { type: 'ic09', size: 512 },   // 512x512
    { type: 'ic10', size: 1024 },  // 1024x1024 (retina 512)
    { type: 'ic11', size: 32 },    // 16x16@2x
    { type: 'ic12', size: 64 },    // 32x32@2x
    { type: 'ic13', size: 256 },   // 128x128@2x
    { type: 'ic14', size: 512 },   // 256x256@2x
  ];

  const images = await Promise.all(
    icnsTypes.map(async ({ type, size }) => {
      const buffer = await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      return { type, buffer };
    })
  );

  // Build ICNS file
  const icnsBuffer = createICNS(images);

  const outputPath = path.join(OUTPUT_DIR, 'icon.icns');
  fs.writeFileSync(outputPath, icnsBuffer);
  console.log('  Created icon.icns');
}

function createICNS(images) {
  // ICNS Header: 8 bytes
  // - 4 bytes: Magic number ('icns')
  // - 4 bytes: File length

  // Each icon:
  // - 4 bytes: Type (e.g., 'ic07')
  // - 4 bytes: Length (including 8-byte header)
  // - N bytes: PNG data

  let totalSize = 8; // Header
  for (const img of images) {
    totalSize += 8 + img.buffer.length;
  }

  const buffer = Buffer.alloc(totalSize);

  // Write header
  buffer.write('icns', 0, 4, 'ascii');
  buffer.writeUInt32BE(totalSize, 4);

  // Write icons
  let offset = 8;
  for (const img of images) {
    buffer.write(img.type, offset, 4, 'ascii');
    buffer.writeUInt32BE(8 + img.buffer.length, offset + 4);
    img.buffer.copy(buffer, offset + 8);
    offset += 8 + img.buffer.length;
  }

  return buffer;
}

async function main() {
  console.log('=== Icon Generation Script ===\n');

  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Error: Source icon not found at ${SOURCE_ICON}`);
    console.error('Please place icon.png in the project root.');
    process.exit(1);
  }

  // Get source image info
  const metadata = await sharp(SOURCE_ICON).metadata();
  console.log(`Source: ${SOURCE_ICON}`);
  console.log(`Size: ${metadata.width}x${metadata.height}`);
  console.log(`Format: ${metadata.format}\n`);

  if (metadata.width < 512 || metadata.height < 512) {
    console.warn('Warning: Source image is smaller than 512x512. Results may be blurry.\n');
  }

  await ensureDir(OUTPUT_DIR);

  try {
    await generatePNGs();
    await generateICO();
    await generateICNS();

    console.log('\n✓ All icons generated successfully!');
    console.log(`Output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('\nError generating icons:', error.message);
    process.exit(1);
  }
}

main();
