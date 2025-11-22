import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Minus, ShoppingCart, X } from 'lucide-react';
import { GestureState, HandPosition } from '@/hooks/useHandTracking';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'burgers' | 'sides' | 'drinks' | 'desserts';
  image: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface KioskModeProps {
  handPositions: HandPosition[];
  gestureStates: GestureState[];
}

const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Classic Burger', price: 8.99, category: 'burgers', image: '🍔' },
  { id: '2', name: 'Cheese Burger', price: 9.99, category: 'burgers', image: '🍔' },
  { id: '3', name: 'Chicken Burger', price: 10.99, category: 'burgers', image: '🍗' },
  { id: '4', name: 'Veggie Burger', price: 8.49, category: 'burgers', image: '🥗' },
  { id: '5', name: 'French Fries', price: 3.99, category: 'sides', image: '🍟' },
  { id: '6', name: 'Onion Rings', price: 4.49, category: 'sides', image: '🧅' },
  { id: '7', name: 'Chicken Nuggets', price: 5.99, category: 'sides', image: '🍗' },
  { id: '8', name: 'Cola', price: 2.49, category: 'drinks', image: '🥤' },
  { id: '9', name: 'Lemonade', price: 2.99, category: 'drinks', image: '🍋' },
  { id: '10', name: 'Milkshake', price: 4.99, category: 'drinks', image: '🥤' },
  { id: '11', name: 'Ice Cream', price: 3.49, category: 'desserts', image: '🍦' },
  { id: '12', name: 'Apple Pie', price: 2.99, category: 'desserts', image: '🥧' },
];

export const KioskMode = ({ handPositions, gestureStates }: KioskModeProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('burgers');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const lastPinchStateRef = useRef<boolean[]>([]);
  const { toast } = useToast();

  const categories = ['burgers', 'sides', 'drinks', 'desserts'];

  // Detect pinch gestures for clicking
  useEffect(() => {
    if (!handPositions.length || !gestureStates.length) return;

    gestureStates.forEach((gesture, index) => {
      const wasPinching = lastPinchStateRef.current[index] || false;
      const isPinching = gesture.isPinching;

      // Detect pinch release (click)
      if (wasPinching && !isPinching) {
        const hand = handPositions[index];
        if (!hand) return;

        const x = hand.x * window.innerWidth;
        const y = hand.y * window.innerHeight;

        // Find and click the element at hand position
        const element = document.elementFromPoint(x, y);
        if (element instanceof HTMLElement) {
          // Find the closest button or clickable card
          const clickable = element.closest('button, [data-clickable]');
          if (clickable instanceof HTMLElement) {
            clickable.click();
          }
        }
      }

      lastPinchStateRef.current[index] = isPinching;
    });
  }, [handPositions, gestureStates]);

  // Detect hover
  useEffect(() => {
    if (!handPositions.length) {
      setHoveredElement(null);
      return;
    }

    const hand = handPositions[0];
    const x = hand.x * window.innerWidth;
    const y = hand.y * window.innerHeight;

    const element = document.elementFromPoint(x, y);
    if (element instanceof HTMLElement) {
      const clickable = element.closest('button, [data-clickable]');
      if (clickable instanceof HTMLElement) {
        setHoveredElement(clickable.id || clickable.getAttribute('data-id') || 'unknown');
      } else {
        setHoveredElement(null);
      }
    }
  }, [handPositions]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast({
      title: "Added to cart",
      description: `${item.name} added`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQty = Math.max(0, i.quantity + delta);
        return newQty === 0 ? null : { ...i, quantity: newQty };
      }
      return i;
    }).filter(Boolean) as CartItem[]);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Order placed!",
      description: `Total: $${getTotal()}. Thank you for your order!`,
    });
    setCart([]);
    setShowCart(false);
  };

  const filteredItems = MENU_ITEMS.filter(item => item.category === selectedCategory);

  return (
    <div className="h-full w-full max-w-2xl mx-auto bg-background flex flex-col relative">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 text-center">
        <h1 className="text-4xl font-bold mb-2">Order Here</h1>
        <p className="text-lg opacity-90">Touch to select items</p>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-4 gap-2 p-4 bg-muted/30">
        {categories.map(cat => (
          <Button
            key={cat}
            id={`category-${cat}`}
            data-id={`category-${cat}`}
            onClick={() => setSelectedCategory(cat)}
            variant={selectedCategory === cat ? "default" : "outline"}
            className={`h-16 text-sm font-semibold capitalize transition-all ${
              hoveredElement === `category-${cat}` ? 'scale-105 shadow-lg' : ''
            }`}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map(item => (
            <Card
              key={item.id}
              id={`item-${item.id}`}
              data-id={`item-${item.id}`}
              data-clickable="true"
              className={`p-4 cursor-pointer transition-all duration-200 ${
                hoveredElement === `item-${item.id}` 
                  ? 'shadow-xl scale-105 border-primary' 
                  : 'hover:shadow-lg'
              }`}
              onClick={() => addToCart(item)}
            >
              <div className="text-6xl text-center mb-3">{item.image}</div>
              <h3 className="font-semibold text-center mb-2">{item.name}</h3>
              <p className="text-2xl font-bold text-center text-primary">
                ${item.price.toFixed(2)}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Button */}
      <div className="p-4 bg-muted/30 border-t">
        <Button
          id="cart-button"
          data-id="cart-button"
          onClick={() => setShowCart(!showCart)}
          className={`w-full h-16 text-lg font-bold relative transition-all ${
            hoveredElement === 'cart-button' ? 'scale-105 shadow-xl' : ''
          }`}
          size="lg"
        >
          <ShoppingCart className="mr-2 h-6 w-6" />
          View Cart ({cart.length} items) - ${getTotal()}
        </Button>
      </div>

      {/* Cart Overlay */}
      {showCart && (
        <div className="absolute inset-0 bg-background z-10 flex flex-col">
          <div className="bg-primary text-primary-foreground p-6 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Your Cart</h2>
            <Button
              id="close-cart"
              data-id="close-cart"
              variant="ghost"
              size="icon"
              onClick={() => setShowCart(false)}
              className={`text-primary-foreground hover:bg-primary-foreground/20 transition-all ${
                hoveredElement === 'close-cart' ? 'scale-110 bg-primary-foreground/20' : ''
              }`}
            >
              <X className="h-8 w-8" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{item.image}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-muted-foreground">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          id={`minus-${item.id}`}
                          data-id={`minus-${item.id}`}
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, -1)}
                          className={`transition-all ${
                            hoveredElement === `minus-${item.id}` ? 'scale-110 shadow-lg' : ''
                          }`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xl font-bold w-8 text-center">{item.quantity}</span>
                        <Button
                          id={`plus-${item.id}`}
                          data-id={`plus-${item.id}`}
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, 1)}
                          className={`transition-all ${
                            hoveredElement === `plus-${item.id}` ? 'scale-110 shadow-lg' : ''
                          }`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          id={`remove-${item.id}`}
                          data-id={`remove-${item.id}`}
                          variant="destructive"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className={`transition-all ${
                            hoveredElement === `remove-${item.id}` ? 'scale-110 shadow-lg' : ''
                          }`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 bg-muted/30 border-t space-y-4">
            <div className="flex justify-between items-center text-2xl font-bold">
              <span>Total:</span>
              <span className="text-primary">${getTotal()}</span>
            </div>
            <Button
              id="checkout-button"
              data-id="checkout-button"
              onClick={handleCheckout}
              className={`w-full h-16 text-xl font-bold transition-all ${
                hoveredElement === 'checkout-button' ? 'scale-105 shadow-xl' : ''
              }`}
              size="lg"
            >
              Checkout
            </Button>
          </div>
        </div>
      )}

      {/* Hand cursor indicators - above everything */}
      {handPositions.map((hand, index) => {
        const isPinching = gestureStates[index]?.isPinching || false;
        return (
          <div
            key={index}
            className="fixed rounded-full pointer-events-none z-[60] transition-all duration-100"
            style={{
              left: `${hand.x * 100}%`,
              top: `${hand.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: isPinching ? '24px' : '32px',
              height: isPinching ? '24px' : '32px',
              backgroundColor: isPinching ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.6)',
              boxShadow: isPinching ? '0 0 20px hsl(var(--primary))' : 'none',
            }}
          />
        );
      })}
    </div>
  );
};
