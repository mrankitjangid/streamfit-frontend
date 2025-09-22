class SocketEventHandler {
    constructor(socket, consumerManager, mediaElementManager) {
        this.socket = socket;
        this.consumerManager = consumerManager;
        this.mediaElementManager = mediaElementManager;
        // Keep track of producer_id to consumer_id mapping
        this.consumerMapping = new Map();
    }

    initSockets() {
        this.socket.on(
            'consumerClosed',
            function ({ consumer_id, producer_id }) {
                console.log('Consumer closed:', consumer_id, 'Producer:', producer_id);
                this.consumerManager.removeConsumer(consumer_id);

                // Use producer_id to remove the media element since that's what was used to create it
                if (producer_id) {
                    this.mediaElementManager.removeConsumer(producer_id);
                    this.consumerMapping.delete(producer_id);
                } else {
                    this.mediaElementManager.removeConsumer(consumer_id);
                }
            }.bind(this)
        );

        this.socket.on(
            'newProducers',
            async function(producerList) {
                console.log('New producers:', producerList);
                for (let { producer_id } of producerList) {
                    await this.handleNewProducer(producer_id);
                }
            }.bind(this)
        );

        this.socket.on(
            'disconnect',
            () => this.handleDisconnect()
        );

        this.socket.on(
            'consumer-stats',
            (data) => {
                console.log(data);
                this.updateStatsPanel(data);
            }
        );
    }

    async handleNewProducer(producer_id) {
        try {
            const { consumer, stream, kind } = await this.consumerManager.consume(producer_id);
            // Create element - now returns wrapper element
            this.mediaElementManager.createElement(kind, stream, consumer._id, document.getElementById('remoteMedia'));

            // Store the mapping between producer_id and consumer_id
            this.consumerMapping.set(producer_id, consumer.id);

            consumer.on(
                'trackended',
                function() {
                    console.log('Consumer track ended, removing:', producer_id);
                    this.consumerManager.removeConsumer(consumer.id);
                    this.mediaElementManager.removeConsumer(producer_id);
                    this.consumerMapping.delete(producer_id);
                }.bind(this)
            );

            consumer.on(
                'transportclose',
                function() {
                    console.log('Consumer transport closed, removing:', producer_id);
                    this.consumerManager.removeConsumer(consumer.id);
                    this.mediaElementManager.removeConsumer(producer_id);
                    this.consumerMapping.delete(producer_id);
                }.bind(this)
            );

            consumer.on(
                'producerclose',
                function() {
                    console.log('Consumer producer closed, removing:', producer_id);
                    this.consumerManager.removeConsumer(consumer.id);
                    this.mediaElementManager.removeConsumer(producer_id);
                    this.consumerMapping.delete(producer_id);
                }.bind(this)
            );
        } catch (err) {
            console.error('Error handling new producer:', err);
        }
    }

    handleDisconnect() {
        // Handle disconnect logic here
        console.log('Disconnected from server');

        // Clean up all consumers and media elements
        this.consumerManager.cleanup();
        this.consumerMapping.clear();
    }

    updateStatsPanel(data) {
        const statsPanel = document.getElementById(`stats-${data.producer_id}`);

        if (statsPanel) {
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
    }

    // Cleanup method to remove all event listeners
    cleanup() {
        if (this.socket) {
            this.socket.off('consumerClosed');
            this.socket.off('newProducers');
            this.socket.off('disconnect');
            this.socket.off('consumer-stats');
        }
        this.consumerMapping.clear();
        console.log('Socket event handlers cleaned up');
    }
}

export default SocketEventHandler;
