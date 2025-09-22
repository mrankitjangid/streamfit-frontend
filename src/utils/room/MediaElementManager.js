class MediaElementManager {
    constructor() {}

    createElement(kind, stream, _id, _parent = null, isProducer = false) {
        let elem;

        if (kind === 'video' || kind === 'screen') {
            const container = document.createElement('div');
            container.id = `container-${_id}`;
            container.className = 'flex flex-col md:flex-row gap-4 mb-6';

            const wrapper = document.createElement('div');
            wrapper.id = isProducer ? _id : `wrapper-${_id}`;
            wrapper.className = 'relative bg-gray-800 rounded-lg overflow-hidden shadow-lg w-full md:w-[640px] h-[360px] flex items-center justify-center';

            elem = document.createElement('video');
            elem.srcObject = stream;
            elem.id = _id;
            elem.playsInline = true;
            elem.autoplay = true;
            elem.muted = true;
            elem.className = 'w-full h-full object-cover';

            elem.onerror = (e) => {
                console.error('Video element error:', e);
                this.handleVideoError(elem, kind);
            };

            elem.onloadedmetadata = () => {
                console.log(`Video loaded: ${elem.videoWidth}x${elem.videoHeight}`);
                this.updateVideoQuality(_id, this.getVideoQuality(elem.videoWidth, elem.videoHeight));
            };

            const typeLabel = document.createElement('div');
            typeLabel.className = 'absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full';
            typeLabel.className += kind === 'video' ? ' bg-blue-500 text-white' : ' bg-green-500 text-white';
            typeLabel.textContent = kind === 'video' ? 'Camera' : 'Screen';

            const qualityIndicator = document.createElement('div');
            qualityIndicator.id = `quality-${_id}`;
            qualityIndicator.className = 'absolute bottom-2 left-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-700 text-white';
            qualityIndicator.textContent = 'Loading...';

            const statsPanel = document.createElement('div');
            statsPanel.id = `stats-${_id}`;
            statsPanel.className = 'bg-gray-100 dark:bg-gray-800 rounded-lg p-3 shadow-md w-full md:w-64 text-xs';

            const data = {
                "current_conditions": {
                    "bandwidth": 2.5,
                    "throughput": 1.03,
                    "packet_loss": 0,
                    "latency": 0,
                    "jitter": 29,
                    "current_congestion": "23.3%",
                    "current_score": 76.68,
                },
                "optimal_configuration": {
                    "bandwidth": 5,
                    "predicted_score": 77.05,
                    "video_quality": "HD",
                    "congestion_reduction": "0.4%",
                    "bandwidth_improvement": "100.0%",
                    "quality_improvement": "0.4%"
                }
            };

            statsPanel.innerHTML = `
                <h3 class="font-bold text-sm mb-2 text-gray-700 dark:text-gray-300">Network Stats</h3>
                <div class="space-y-1">
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Bandwidth:</span>
                        <span class="font-medium">${data.current_conditions.bandwidth} Mbps</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Throughput:</span>
                        <span class="font-medium">${data.current_conditions.throughput}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Latency:</span>
                        <span class="font-medium">${data.current_conditions.latency} ms</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Jitter:</span>
                        <span class="font-medium">${data.current_conditions.jitter} ms</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Congestion:</span>
                        <span class="font-medium">${data.current_conditions.current_congestion}</span>
                    </div>
                    <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <h4 class="font-semibold text-xs mb-1 text-gray-700 dark:text-gray-300">Optimal Configuration</h4>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Suggested Quality:</span>
                            <span class="font-medium" id="quality-text-${_id}">${data.optimal_configuration.video_quality}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Score:</span>
                            <span class="font-medium">${data.current_conditions.current_score.toFixed(1)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Bandwidth:</span>
                            <span class="font-medium">${data.optimal_configuration.bandwidth} Mbps</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-400">Congestion Reduction:</span>
                            <span class="font-medium">${data.optimal_configuration.congestion_reduction}</span>
                        </div>
                    </div>
                </div>
            `;

            wrapper.appendChild(elem);
            wrapper.appendChild(typeLabel);
            wrapper.appendChild(qualityIndicator);
            container.appendChild(wrapper);
            container.appendChild(statsPanel);

            if (_parent) {
                _parent.appendChild(container);
            }

            return wrapper;
        } else if (kind === 'audio' && !isProducer) {
            elem = document.createElement('audio');
            elem.srcObject = stream;
            elem.id = _id;
            elem.playsinline = true;
            elem.autoplay = true;
            elem.className = 'hidden';

            let audioContainer = document.getElementById('audioEl');
            if (!audioContainer) {
                audioContainer = document.createElement('div');
                audioContainer.id = 'audioEl';
                audioContainer.className = 'hidden';
                document.body.appendChild(audioContainer);
            }

            audioContainer.appendChild(elem);
            this.elementMap.set(_id, elem);

            return elem;
        } else if (kind === 'audio' && isProducer) {
            console.log('Skipping audio producer UI creation to prevent echo');
            return null;
        }
    }

    handleVideoError(videoElement, kind) {
        console.error('Video error occurred:', videoElement.error);

        const wrapper = videoElement.parentElement;
        if (wrapper) {
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center';
            errorOverlay.innerHTML = `
                <div class="text-center text-white p-4">
                    <div class="text-lg font-semibold mb-2">Video Error</div>
                    <div class="text-sm">Unable to load ${kind} stream</div>
                    <div class="text-xs mt-2 opacity-75">Check camera permissions and try again</div>
                </div>
            `;
            wrapper.appendChild(errorOverlay);
        }
    }

    getVideoQuality(width, height) {
        const resolution = width * height;
        if (resolution >= 3840 * 2160) return '4K';
        if (resolution >= 1920 * 1080) return 'FHD';
        if (resolution >= 1280 * 720) return 'HD';
        if (resolution >= 640 * 480) return 'SD';
        return 'LD';
    }

    cleanupElement(elementKey, elementType = 'consumer') {
        console.log(`Cleaning up ${elementType} element:`, elementKey);

        let element = document.getElementById(elementKey);

        if (element) {
            if (element.srcObject) {
                element.srcObject.getTracks().forEach(track => track.stop());
            }
            element.remove();
            console.log('Element removed successfully');
        } else {
            console.log(`⚠️ No element found for ${elementType}: ${elementKey}`);
        }
    }

    removeConsumer(producer_id) {
        console.log('Removing consumer with producer_id:', producer_id);
        this.cleanupElement(`container-${producer_id}`, 'consumer');
    }

    closeProducer(type, producer_id) {
        console.log('Closing producer:', type, producer_id);
        this.cleanupElement(`container-${producer_id}`, 'producer');
    }

    updateVideoQuality(elementId, quality) {
        const qualityIndicator = document.getElementById(`quality-${elementId}`);
        const qualityText = document.getElementById(`quality-text-${elementId}`);

        if (!qualityIndicator) return;

        let bgColor, textColor;
        switch (quality) {
            case '4K':
                bgColor = 'bg-green-500';
                textColor = 'text-white';
                break;
            case 'FHD':
                bgColor = 'bg-blue-500';
                textColor = 'text-white';
                break;
            case 'HD':
                bgColor = 'bg-yellow-500';
                textColor = 'text-gray-900';
                break;
            case 'SD':
                bgColor = 'bg-red-500';
                textColor = 'text-white';
                break;
            default:
                bgColor = 'bg-gray-700';
                textColor = 'text-white';
        }

        qualityIndicator.className = qualityIndicator.className
            .replace(/bg-\w+-\d+/g, '')
            .replace(/text-\w+-\d+/g, '')
            .trim();

        qualityIndicator.className = `absolute bottom-2 left-2 px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`;
        qualityIndicator.textContent = quality;

        if (qualityText) {
            qualityText.textContent = quality;
        }

        qualityIndicator.classList.add('ring-2', 'ring-white', 'ring-opacity-70');
        setTimeout(() => {
            qualityIndicator.classList.remove('ring-2', 'ring-white', 'ring-opacity-70');
        }, 1000);
    }

    cleanupAllRemoteMedia() {
        console.log('Starting comprehensive cleanup of all remote media');

        const mapSize = this.elementMap.size;
        console.log(`Clearing element map with ${mapSize} entries`);

        for (const [producerId, wrapper] of this.elementMap) {
            console.log('Removing element from map:', producerId);

            const video = wrapper.querySelector('video');
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
            }

            const container = wrapper.parentElement;
            if (container) {
                container.classList.add('transition-all', 'duration-300', 'opacity-0', 'scale-95');
                setTimeout(() => {
                    if (container.parentNode) {
                        container.parentNode.removeChild(container);
                    }
                }, 300);
            } else {
                wrapper.remove();
            }
        }

        this.elementMap.clear();

        const videoElements = document.querySelectorAll('video[id]');
        videoElements.forEach(elem => {
            if (!elem.closest('[id^="container-"]')) {
                console.log('Removing orphaned video element:', elem.id);
                if (elem.srcObject) {
                    elem.srcObject.getTracks().forEach(track => track.stop());
                }
                elem.remove();
            }
        });

        const statsPanels = document.querySelectorAll('[id^="stats-"]');
        statsPanels.forEach(panel => {
            console.log('Removing stats panel:', panel.id);
            panel.remove();
        });

        console.log('Comprehensive cleanup completed');
    }
}

export default MediaElementManager;
