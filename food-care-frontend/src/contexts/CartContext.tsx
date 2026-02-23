import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { CartItem, Product, SubscriptionFrequency } from '../types'

interface CartContextType {
    items: CartItem[]
    addToCart: (
        product: Product,
        quantity: number,
        isSubscription?: boolean,
        frequency?: SubscriptionFrequency,
        discount?: number
    ) => void
    removeFromCart: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    toggleSelectItem: (productId: string) => void
    toggleSelectAll: () => void
    clearCart: () => void
    getTotal: () => number
    getSelectedTotal: () => number
    getSelectedItems: () => CartItem[]
    getItemCount: () => number
    clearSelectedItems: () => void // ✅

}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem('cart')
        return saved ? JSON.parse(saved) : []
    })

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items))
    }, [items])

    const addToCart = (
        product: Product,
        quantity: number,
        isSubscription = false,
        frequency?: SubscriptionFrequency,
        discount?: number
    ) => {
        setItems(prev => {
            const existing = prev.find(i => i.product.id === product.id)
            if (existing) {
                return prev.map(i =>
                    i.product.id === product.id
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                )
            }
            return [
                ...prev,
                {
                    product,
                    quantity,
                    selected: true,
                    isSubscription,
                    subscription: isSubscription && frequency ? {
                        frequency,
                        discount: discount || 0
                    } : undefined,
                },
            ]
        })
    }
    const clearSelectedItems = () => {
        setItems(prevItems =>
            prevItems.filter(item => !item.selected)
        );
    };
    const removeFromCart = (productId: string) => {
        setItems(prev => prev.filter(i => i.product.id !== productId))
    }

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId)
            return
        }
        setItems(prev =>
            prev.map(i =>
                i.product.id === productId ? { ...i, quantity } : i
            )
        )
    }

    const toggleSelectItem = (productId: string) => {
        setItems(prev =>
            prev.map(i =>
                i.product.id === productId
                    ? { ...i, selected: !i.selected }
                    : i
            )
        )
    }

    const toggleSelectAll = () => {
        const allSelected = items.every(i => i.selected)
        setItems(prev => prev.map(i => ({ ...i, selected: !allSelected })))
    }

    const clearCart = () => setItems([])

    const getTotal = () =>
        items.reduce((total, i) => {
            const price = i.subscription
                ? i.product.basePrice * (1 - i.subscription.discount / 100)
                : i.product.basePrice;
            return total + price * i.quantity;
        }, 0)

    const getSelectedTotal = () =>
        items.reduce((total, i) => {
            if (!i.selected) return total;
            const price = i.subscription
                ? i.product.basePrice * (1 - i.subscription.discount / 100)
                : i.product.basePrice;
            return total + price * i.quantity;
        }, 0)

    const getSelectedItems = () => items.filter(i => i.selected)

    const getItemCount = () =>
        items.reduce((count, i) => count + i.quantity, 0)

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                toggleSelectItem,
                toggleSelectAll,
                clearCart,
                getTotal,
                getSelectedTotal,
                getSelectedItems,
                getItemCount,
                clearSelectedItems,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export const useCart = () => {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCart must be used within CartProvider')
    return ctx
}
