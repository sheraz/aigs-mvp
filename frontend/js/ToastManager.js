class ToastManager {
    constructor() {
        this.toasts = [];
        this.createContainer();
    }

    createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        this.container = container;
    }

    addToast(message, type = 'info', duration = 5000) {
        const id = Date.now() + Math.random();
        const toast = { id, message, type, duration };
        
        this.toasts.push(toast);
        this.renderToast(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            this.removeToast(id);
        }, duration);
        
        return id;
    }

    removeToast(id) {
        this.toasts = this.toasts.filter(toast => toast.id !== id);
        const toastElement = document.getElementById(`toast-${id}`);
        if (toastElement) {
            toastElement.remove();
        }
    }

    renderToast(toast) {
        const toastElement = document.createElement('div');
        toastElement.id = `toast-${toast.id}`;
        toastElement.className = `max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 ${
            toast.type === 'error' ? 'border-l-4 border-red-400' :
            toast.type === 'warning' ? 'border-l-4 border-yellow-400' :
            toast.type === 'success' ? 'border-l-4 border-green-400' :
            'border-l-4 border-blue-400'
        }`;

        toastElement.innerHTML = `
            <div class="p-4">
                <div class="flex items-start">
                    <div class="flex-1">
                        <p class="text-sm font-medium ${
                            toast.type === 'error' ? 'text-red-800' :
                            toast.type === 'warning' ? 'text-yellow-800' :
                            toast.type === 'success' ? 'text-green-800' :
                            'text-blue-800'
                        }">
                            ${toast.message}
                        </p>
                    </div>
                    <button onclick="toastManager.removeToast(${toast.id})"
                            class="ml-4 inline-flex text-gray-400 hover:text-gray-600">
                        <span class="sr-only">Close</span>
                        ×
                    </button>
                </div>
            </div>
        `;

        this.container.appendChild(toastElement);
    }
}