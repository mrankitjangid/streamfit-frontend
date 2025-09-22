class DeviceManager {
    constructor(mediasoupClient) {
        this.mediasoupClient = mediasoupClient;
        this.device = null;
    }

    async loadDevice(routerRtpCapabilities) {
        let device;
        try {
            device = new this.mediasoupClient.Device();
        } catch (err) {
            console.error('Error creating device:', err);
            throw err;
        }
        await device.load({
            routerRtpCapabilities
        });
        this.device = device;
        return device;
    }

    getDevice() {
        return this.device;
    }

    getRtpCapabilities() {
        return this.device?.rtpCapabilities;
    }
}

export default DeviceManager;
