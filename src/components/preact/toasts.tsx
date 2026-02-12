import { useState } from 'preact/hooks'

export const useToasts = () => {
    const [toasts, setToasts] = useState<{ id: number; message: string }[]>([])

    const addToast = (message: string) => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message }])
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id))
        }, 3000)
    }

    return { toasts, addToast }
}

export const ToastDisplay = ({ toasts }: { toasts: { id: number; message: string }[] }) => {
    return (
        <div class="toast-container">
            {toasts.map(toast => (
                <div key={toast.id} class="toast">
                    {toast.message}
                </div>
            ))}
        </div>
    )
}
