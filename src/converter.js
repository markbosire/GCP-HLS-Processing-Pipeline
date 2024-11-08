const fs = require('fs');
const path = require('path');
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');


const { mkdirp } = require('mkdirp');
// Tell fluent-ffmpeg where it can find FFmpeg

/**
 * Converts an MP4 file to HLS format with multiple quality levels
 * @param {string|Buffer|File} inputFile - The input file (can be a path or file object)
 * @param {Object} options - Optional configuration
 * @param {string} options.outputDir - Custom output directory (default: 'media')
 * @returns {Promise<Object>} - Results of the conversion including paths to generated files
 */

ffmpeg.setFfmpegPath(ffmpegStatic);
async function convertVideoToHLS(inputFile, options = {}) {
    try {
        let filePath;
        let filename;

        // Handle different input types
        if (typeof inputFile === 'string') {
            filePath = inputFile;
            filename = path.parse(inputFile).name;
        } else if (inputFile instanceof Buffer) {
            filename = `temp_${Date.now()}`;
            filePath = path.join(process.cwd(), `${filename}.mp4`);
            await fs.promises.writeFile(filePath, inputFile);
        } else if (inputFile.path) {
            filePath = inputFile.path;
            filename = path.parse(filePath).name;
        } else {
            throw new Error('Invalid input file format');
        }

        const baseOutputDir = options.outputDir || 'media';
        const outputDir = path.join(baseOutputDir, filename, 'hls');
        await mkdirp(outputDir);

        console.log('Starting conversion process...');
        const results = {
            coverImages: [],
            previewGif: '',
            playlists: [],
            masterPlaylist: ''
        };

        // Generate cover images and preview GIF using fluent-ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .screenshots({
                    timestamps: [20],
                    filename: 'cover_h1.jpg',
                    folder: outputDir,
                    size: '1920x1080'
                })
                .on('end', () => resolve())
                .on('error', reject);
        });
        results.coverImages.push(path.join(outputDir, 'cover_h1.jpg'));

        await new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .screenshots({
                    timestamps: [20],
                    filename: 'cover_l1.jpg',
                    folder: outputDir,
                    size: '760x428'
                })
                .on('end', () => resolve())
                .on('error', reject);
        });
        results.coverImages.push(path.join(outputDir, 'cover_l1.jpg'));

        await new Promise((resolve, reject) => {
            ffmpeg(filePath)
                .output(path.join(outputDir, 'preview.gif'))
                .setStartTime('00:00:10')
                .duration(3)
                .size('640x360')
                .fps(2)
                .on('end', () => resolve())
                .on('error', reject)
                .run();
        });
        results.previewGif = path.join(outputDir, 'preview.gif');

        // Generate HLS playlist for multiple resolutions
        const resolutions = [
            { size: '640x360', name: '360p', bandwidth: 375000 },
            { size: '800x480', name: '480p', bandwidth: 750000 },
            { size: '1280x720', name: '720p', bandwidth: 2000000 },
            { size: '1920x1080', name: '1080p', bandwidth: 3500000 }
        ];

        for (const res of resolutions) {
            await new Promise((resolve, reject) => {
                ffmpeg(filePath)
                    .output(path.join(outputDir, `${res.name}_out.m3u8`))
                    .videoCodec('libx264')
                    .size(res.size)
                    .addOptions([
                        '-profile:v baseline',
                        '-level 3.0',
                        '-start_number 0',
                        '-hls_time 10',
                        '-hls_list_size 0',
                        '-f hls'
                    ])
                    .on('end', () => {
                        results.playlists.push({
                            resolution: res.name,
                            path: path.join(outputDir, `${res.name}_out.m3u8`)
                        });
                        resolve();
                    })
                    .on('error', reject)
                    .run();
            });
        }

        // Generate master playlist
        const masterPlaylist = resolutions.map(res => 
            `#EXT-X-STREAM-INF:BANDWIDTH=${res.bandwidth},RESOLUTION=${res.size}\n${res.name}_out.m3u8`
        );
        const masterPlaylistContent = `#EXTM3U\n${masterPlaylist.join('\n')}`;
        const masterPlaylistPath = path.join(outputDir, `${filename}.m3u8`);
        
        await fs.promises.writeFile(masterPlaylistPath, masterPlaylistContent);
        results.masterPlaylist = masterPlaylistPath;

        if (inputFile instanceof Buffer) {
            await fs.promises.unlink(filePath);
        }

        console.log('Conversion completed successfully!');
        return results;

    } catch (error) {
        console.error('Error during conversion:', error);
        throw error;
    }
}

module.exports = convertVideoToHLS;