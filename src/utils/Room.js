class RoomClient {
    constructor(_room_id, _name, _socket, _mediasoupClient) {
        this.room_id = _room_id;
        this.name = _name;
        this.socket = _socket;
        this.mediasoupClient = _mediasoupClient;

        this.device = null;
        this.producerTransport = null;
        this.consumerTransport = null;
        
        this.producers = new Map();
        this.consumers = new Map();

        this.producerLabel = new Map();
    }

    async joinRoom() {
        this.socket.request(
            'join-room',
            {
                room_id: this.room_id,
                name: this.name
            }
        )
        .then(
            async function(e) {
                console.log('Joined room', e);
                const routerRtpCapabilities = await this.socket.request('getRouterRtpCapabilities');

                let device = await this.loadDevice(routerRtpCapabilities);
                this.device = device;

                this.initSockets();
                await this.initTransports();
                this.socket.emit('getProducers');
            }.bind(this)
        )
        .catch(( err ) => {
            console.error('join error:', err);
        });
    }

    exit(offline = false) {
        const clean = () => {
            this.consumerTransport.close();
            this.producerTransport.close();
            this.socket.off('disconnect');
            this.socket.off('newProducers');
            this.socket.off('consumerClosed');
        }

        if( !offline ) {
            this.socket
                .request('exit-room')
                .then((e) => console.log(e))
                .catch((e) => console.log(e))
                .finally(() => clean());
        } else {
            clean();
        }
    }

    async loadDevice(routerRtpCapabilities) {
        let device;
        try {
            device = new this.mediasoupClient.Device();
        } catch( err ) {
            console.error('Error creating device:', err);
        }
        await device.load({
            routerRtpCapabilities
        });
        return device;
    }

    async initTransports() {
        // initialize producer transports
        {
            const data = await this.socket.request(
                'createWebRtcTransport', {
                    rtpCapabilities: this.device.rtpCapabilities
                }
            );
            if( data?.error ) {
                console.error(data.error);
                return;
            }

            this.producerTransport = this.device.createSendTransport(data);

            this.producerTransport.on(
                'connect',
                function({ dtlsParameters }, cb, eb) {
                    this.socket.request(
                        'connectTransport', {
                            transport_id: data.id,
                            dtlsParameters
                        }
                    )
                    .then(cb)
                    .catch(eb);
                }.bind(this)
            );

            this.producerTransport.on(
                'produce',
                async function({ kind, rtpParameters }, cb, eb) {
                    try {
                        const { producer_id } = await this.socket.request(
                            'produce', {
                                transport_id: this.producerTransport.id,
                                kind,
                                rtpParameters
                            }
                        )
                        cb({ id: producer_id });
                    } catch( err ) {
                        eb(err);
                    }
                }.bind(this)
            );

            this.producerTransport.on(
                'connectionstatechange',
                function( state ) {
                    if( state === 'failed' ) {
                        this.producerTransport.close();
                    }
                }.bind(this)
            );
        }

        // initialize consumer transports
        {
            const data = await this.socket.request(
                'createWebRtcTransport', {
                    forceTcp: false
                }
            );
            if( data?.error ) {
                console.error(data.error);
                return;
            }

            this.consumerTransport = this.device.createRecvTransport(data);

            this.consumerTransport.on(
                'connect',
                function( {dtlsParameters}, cb, eb ) {
                    this.socket.request(
                        'connectTransport', {
                            transport_id: this.consumerTransport.id,
                            dtlsParameters
                        }
                    )
                    .then(cb)
                    .catch(eb);
                }.bind(this)
            );

            this.consumerTransport.on(
                'connectionstatechange',
                function( state ) {
                    if( state === 'failed' ) {
                        this.consumerTransport.close();
                    }
                }.bind(this)
            );
        }
    }

    initSockets() {
        this.socket.on(
            'consumerClosed',
            function ({ consumer_id }) {
                console.log('Consumer closed:', consumer_id);
                this.removeConsumer(consumer_id);
            }.bind(this)
        );

        this.socket.on(
            'newProducers',
            async function(producerList) {
                console.log('New producers:', producerList);
                for( let { producer_id } of producerList ) {
                    await this.consume(producer_id);
                }
            }.bind(this)
        );

        this.socket.on(
            'disconnect',
            () => this.exit(true)
        );


        this.socket.on(
            'consumer-stats',
            (data) => {
                console.log(data);

                const statsPanel = document.getElementById(`stats-${data.producer_id}`);
                
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
                            <span class="font-medium">${data.current_conditions.congestion_score}</span>
                        </div>
                        <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <h4 class="font-semibold text-xs mb-1 text-gray-700 dark:text-gray-300">Optimal Configuration</h4>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-400">Suggested Quality:</span>
                                <span class="font-medium" id="quality-text-${data.producer_id}">${data.optimal_configuration.video_quality}</span>
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
                                <span class="font-medium">${data.optimal_configuration.congestion_reduction_percentage}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        );
    }

    async produce(type) {
        try {
            let options = {}, stream;
            const vp9Codec = this.device?.rtpCapabilities?.codecs?.find(
                c => c.mimeType.toLowerCase() === 'video/vp9'
            );
            switch(type) {
                case 'video':
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                        },
                        // video: true
                    });
                    options.track = stream.getVideoTracks()[0];
                    if (vp9Codec) {
                        options.codec = vp9Codec;
                        options.encodings = [
                            {
                                maxBitrate: 5_000_000
                            }
                        ];
                        options.codecOptions = {
                            videoGoogleStartBitrate: 1000
                        };
                    } else {
                        options.encodings = [
                            { maxBitrate: 500_000, scaleResolutionDownBy: 4 },
                            { maxBitrate: 1_000_000, scaleResolutionDownBy: 2 },
                            { maxBitrate: 2_000_000, scaleResolutionDownBy: 1 }
                        ];
                    }
                    break;
                case 'audio':
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: true
                    });
                    options.track = stream.getAudioTracks()[0];
                    break;
                case 'screen':
                    stream = await navigator.mediaDevices.getDisplayMedia();
                    options.track = stream.getVideoTracks()[0];
                    options.codec = this.device?.rtpCapabilities?.codecs?.find(c => c.mimeType.toLowerCase() === 'video/vp9');
                    options.codecOptions = {
                        videoGoogleStartBitrate: 1000
                    }
                    break;
                default:
                    return;
            }
    
            const producer = await this.producerTransport.produce(options);
    
            this.producers.set(producer.id, producer);
            this.producerLabel.set(type, producer.id);
    
            const parent = document.getElementById('localMedia');
            let elem = this.createElement(type, stream, producer.id, parent);
    
            producer.on('trackended', () => {
                this.closeProducer(type);
            });

            producer.on('transportclose', () => {
                console.log('Producer tranport closed');
                if( type !== 'audio' ) {
                    elem.srcObject.getTracks().forEach(track => track.stop());
                    elem.parentNode.removeChild(elem);
                }
                this.producers.delete(producer.id);
            });

            producer.on('close', () => {
                console.log('Closing producer');
                if( type !== 'audio' ) {
                    elem.srcObject.getTracks().forEach(track => track.stop());
                    elem.parentNode.removeChild(elem);
                }
                this.producers.delete(producer.id);
            });
        } catch( err ) {
            console.error('Error producing:', err);
        }
    }

    async consume(producer_id) {
        if( !this.consumerTransport ) return;
        const { consumer, stream, kind } = await this.getConsumeStream(producer_id);

        this.consumers.set(producer_id, consumer);

        const parent = document.getElementById('remoteMedia');
        this.createElement(kind, stream, producer_id, parent);

        consumer.on(
            'trackended',
            function() {
                this.removeConsumer(producer_id);
            }.bind(this)
        );

        consumer.on(
            'transportclose',
            function() {
                this.removeConsumer(producer_id);
            }.bind(this)
        );

        consumer.on(
            'producerclose',
            function() {
                this.removeConsumer(producer_id);
            }.bind(this)
        );
    }

    async getConsumeStream(producerId) {
        const { rtpCapabilities } = this.device;
        const data = await this.socket.request('consume', {
            rtpCapabilities,
            consumerTransportId: this.consumerTransport.id,
            producerId
        });
        const { id, kind, rtpParameters } = data;

        let codecOptions = {};
        const consumer = await this.consumerTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            codecOptions,
        });

        const stream = new MediaStream();
        stream.addTrack(consumer.track);

        return {
            consumer,
            stream,
            kind
        }
    }

    // removeConsumer(consumer_id) {
    //     const elem = document.getElementById(consumer_id);
    //     console.log('removing consumer', consumer_id);
    //     elem.srcObject.getTracks().forEach(track => track.stop());
    //     elem.parentNode.removeChild(elem);
    //     this.consumers.get(consumer_id).close();
    //     this.consumers.delete(consumer_id);
    // }

    // closeProducer(type) {
    //     if( !this.producerLabel.has(type) ) {
    //         console.log('No producer for type:', type);
    //         return;
    //     }

    //     const producer_id = this.producerLabel.get(type);

    //     this.socket.emit('producerClosed', {
    //         producer_id
    //     });

    //     this.producers.get(producer_id).close();
    //     this.producers.delete(producer_id);
    //     this.producerLabel.delete(type);

    //     if( type !== 'audio' ) {
    //         const elem = document.getElementById(producer_id);
    //         elem.srcObject.getTracks().forEach(track => track.stop());
    //         elem.parentNode.removeChild(elem);
    //     }
    // }

    // createElement(kind, stream, _id, _parent = null) {
    //     let elem;
    //     if( kind === 'video' || kind === 'screen' ) {
    //         elem = document.createElement('video');
    //         elem.srcObject = stream;
    //         elem.id = _id;
    //         elem.playsInline = false;
    //         elem.autoplay = true;
    //         _parent.appendChild(elem);
    //     } else {
    //         elem = document.createElement('audio');
    //         elem.srcObject = stream;
    //         elem.id = _id;
    //         elem.playsinline = false;
    //         elem.autoplay = true;
    //         document.getElementById('audioEl').appendChild(elem);
    //     }
    //     return elem;
    // }

    
    


    
    /**
 * Creates a media element (video or audio) with Tailwind CSS styling
 * @param {string} kind - Type of media ('video', 'screen', or 'audio')
 * @param {MediaStream} stream - The media stream to attach
 * @param {string} _id - Element ID
 * @param {HTMLElement} _parent - Parent element to append to (optional)
 * @returns {HTMLElement} The created media element
 */
createElement(kind, stream, _id, _parent = null) {
    let elem;
    
    if (kind === 'video' || kind === 'screen') {
        // Create container for video and stats
        const container = document.createElement('div');
        container.id = `container-${_id}`;
        container.className = 'flex flex-col md:flex-row gap-4 mb-6';
        
        // Create wrapper div for video - increased size
        const wrapper = document.createElement('div');
        wrapper.id = `wrapper-${_id}`;
        wrapper.className = 'relative bg-gray-800 rounded-lg overflow-hidden shadow-lg w-full md:w-[640px] h-[360px] flex items-center justify-center';
        
        // Create video element
        elem = document.createElement('video');
        elem.srcObject = stream;
        elem.id = _id;
        elem.playsInline = false;
        elem.autoplay = true;
        elem.className = 'w-full h-full object-cover';
        
        // Create label for video type
        const typeLabel = document.createElement('div');
        typeLabel.className = 'absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full';
        
        if (kind === 'video') {
            typeLabel.className += ' bg-blue-500 text-white';
            typeLabel.textContent = 'Camera';
        } else {
            typeLabel.className += ' bg-green-500 text-white';
            typeLabel.textContent = 'Screen';
        }
        
        // Create quality indicator in bottom left
        const qualityIndicator = document.createElement('div');
        qualityIndicator.id = `quality-${_id}`;
        qualityIndicator.className = 'absolute bottom-2 left-2 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-gray-900';
        // qualityIndicator.textContent = 'HD'; // Default quality
        qualityIndicator.textContent = `${elem.videoWidth} x ${elem.videoHeight}`;;
        console.log(`${elem.videoWidth} x ${elem.videoHeight}`)
        
        const statsPanel = document.createElement('div');
        statsPanel.id = `stats-${_id}`;
        statsPanel.className = 'bg-gray-100 dark:bg-gray-800 rounded-lg p-3 shadow-md w-full md:w-64 text-xs';

        
        // Hardcoded stats content
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
                "video_quality": "FHD",
                "congestion_reduction": "0.4%",
                "bandwidth_improvement": "100.0%",
                "quality_improvement": "0.4%"
            }
        };
        
        // Format the stats panel HTML
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
        
        // Assemble the video component
        wrapper.appendChild(elem);
        wrapper.appendChild(typeLabel);
        wrapper.appendChild(qualityIndicator);
        
        // Assemble the container
        container.appendChild(wrapper);
        container.appendChild(statsPanel);
        
        // Append to parent container
        if (_parent) {
            _parent.appendChild(container);
        }
        
        // Return the video element (not the wrapper)
        return elem;
    } else {
        // Create audio element
        elem = document.createElement('audio');
        elem.srcObject = stream;
        elem.id = _id;
        elem.playsinline = false;
        elem.autoplay = true;
        elem.className = 'hidden'; // Hide audio elements
        
        // Find or create audio container
        let audioContainer = document.getElementById('audioEl');
        if (!audioContainer) {
            audioContainer = document.createElement('div');
            audioContainer.id = 'audioEl';
            audioContainer.className = 'hidden';
            document.body.appendChild(audioContainer);
        }
        
        audioContainer.appendChild(elem);
        return elem;
    }
}

/**
 * Removes a consumer and cleans up associated resources
 * @param {string} consumer_id - ID of the consumer to remove
 */
removeConsumer(producer_id) {
    // Find the container element
    const container = document.getElementById(`container-${producer_id}`);
    const elem = document.getElementById(producer_id);
    
    console.log('Removing consumer', producer_id);
    
    if (elem) {
        // Stop all tracks
        if (elem.srcObject) {
            elem.srcObject.getTracks().forEach(track => track.stop());
        }
    }
    
    // Remove the container with animation
    if (container) {
        // Add fade-out and scale-down animation
        container.classList.add('transition-all', 'duration-300', 'opacity-0', 'scale-95');
        
        // Remove after animation completes
        setTimeout(() => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 300);
    } else if (elem && elem.parentNode) {
        // Fallback if container not found
        elem.parentNode.removeChild(elem);
    }
    
    // Close and delete the consumer
    const consumer = this.consumers.get(producer_id);
    if (consumer) {
        consumer.close();
        this.consumers.delete(producer_id);
    }
}

/**
 * Closes a producer and cleans up associated resources
 * @param {string} type - Type of producer to close ('video', 'screen', or 'audio')
 */
closeProducer(type) {
    // Check if producer exists
    if (!this.producerLabel.has(type)) {
        console.log('No producer for type:', type);
        return;
    }
    
    // Get producer ID
    const producer_id = this.producerLabel.get(type);
    
    // Notify server
    this.socket.emit('producerClosed', {
        producer_id
    });
    
    // Close and clean up producer
    const producer = this.producers.get(producer_id);
    if (producer) {
        producer.close();
        this.producers.delete(producer_id);
    }
    
    // Remove from producer label map
    this.producerLabel.delete(type);
    
    // Clean up media element for video/screen
    if (type !== 'audio') {
        const container = document.getElementById(`container-${producer_id}`);
        const elem = document.getElementById(producer_id);
        
        if (elem && elem.srcObject) {
            // Stop all tracks
            elem.srcObject.getTracks().forEach(track => track.stop());
        }
        
        if (container) {
            // Add fade-out and scale-down animation
            container.classList.add('transition-all', 'duration-300', 'opacity-0', 'scale-95');
            
            // Remove after animation completes
            setTimeout(() => {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }, 300);
        } else if (elem && elem.parentNode) {
            // Fallback if container not found
            elem.parentNode.removeChild(elem);
        }
    }
}

/**
 * Updates the quality indicator for a video element
 * This function should be called when the actual video quality changes
 * @param {string} elementId - ID of the video element
 * @param {string} quality - Quality level ('4K', 'FHD', 'HD', 'SD')
 */
updateVideoQuality(elementId, quality) {
    const qualityIndicator = document.getElementById(`quality-${elementId}`);
    const qualityText = document.getElementById(`quality-text-${elementId}`);
    
    if (!qualityIndicator) return;
    
    // Set color based on quality
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
    
    // Remove all background and text color classes
    qualityIndicator.className = qualityIndicator.className
        .replace(/bg-\w+-\d+/g, '')
        .replace(/text-\w+-\d+/g, '')
        .trim();
    
    // Add new classes
    qualityIndicator.className = `absolute bottom-2 left-2 px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`;
    
    // Update text
    qualityIndicator.textContent = quality;
    
    // Update quality in stats panel if it exists
    if (qualityText) {
        qualityText.textContent = quality;
    }
    
    // Add a brief highlight effect
    qualityIndicator.classList.add('ring-2', 'ring-white', 'ring-opacity-70');
    setTimeout(() => {
        qualityIndicator.classList.remove('ring-2', 'ring-white', 'ring-opacity-70');
    }, 1000);
}




}

export default RoomClient;