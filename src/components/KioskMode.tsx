import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Minus, ShoppingCart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GestureState, HandPosition } from '@/hooks/useHandTracking';
import { useToast } from '@/hooks/use-toast';
import useEmblaCarousel from 'embla-carousel-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'burgers' | 'sides' | 'drinks' | 'desserts' | 'salads' | 'breakfast' | 'snacks' | 'coffee';
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
  { id: '8', name: 'Mozzarella Sticks', price: 5.49, category: 'sides', image: '🧀' },
  { id: '9', name: 'Cola', price: 2.49, category: 'drinks', image: '🥤' },
  { id: '10', name: 'Lemonade', price: 2.99, category: 'drinks', image: '🍋' },
  { id: '11', name: 'Milkshake', price: 4.99, category: 'drinks', image: '🥤' },
  { id: '12', name: 'Iced Tea', price: 2.49, category: 'drinks', image: '🧋' },
  { id: '13', name: 'Ice Cream', price: 3.49, category: 'desserts', image: '🍦' },
  { id: '14', name: 'Apple Pie', price: 2.99, category: 'desserts', image: '🥧' },
  { id: '15', name: 'Brownie', price: 3.99, category: 'desserts', image: '🍫' },
  { id: '16', name: 'Caesar Salad', price: 7.99, category: 'salads', image: '🥗' },
  { id: '17', name: 'Greek Salad', price: 8.49, category: 'salads', image: '🥗' },
  { id: '18', name: 'Garden Salad', price: 6.99, category: 'salads', image: '🥗' },
  { id: '19', name: 'Pancakes', price: 6.99, category: 'breakfast', image: '🥞' },
  { id: '20', name: 'Eggs & Bacon', price: 7.99, category: 'breakfast', image: '🍳' },
  { id: '21', name: 'Breakfast Burrito', price: 8.49, category: 'breakfast', image: '🌯' },
  { id: '22', name: 'Nachos', price: 5.99, category: 'snacks', image: '🧀' },
  { id: '23', name: 'Popcorn', price: 3.49, category: 'snacks', image: '🍿' },
  { id: '24', name: 'Pretzel', price: 3.99, category: 'snacks', image: '🥨' },
  { id: '25', name: 'Espresso', price: 2.99, category: 'coffee', image: '☕' },
  { id: '26', name: 'Cappuccino', price: 3.99, category: 'coffee', image: '☕' },
  { id: '27', name: 'Latte', price: 4.49, category: 'coffee', image: '☕' },
];

export const KioskMode = ({ handPositions, gestureStates }: KioskModeProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('burgers');
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [clickedElement, setClickedElement] = useState<string | null>(null);
  const lastPinchStateRef = useRef<boolean[]>([]);
  const pinchStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, dragFree: true });

  const categories = ['burgers', 'sides', 'drinks', 'desserts', 'salads', 'breakfast', 'snacks', 'coffee'];

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const handleCategoryChange = (category: string) => {
    if (category === selectedCategory) return;
    setIsLoadingCategory(true);
    setSelectedCategory(category);
    setTimeout(() => setIsLoadingCategory(false), 400);
  };

  const handleViewCart = () => {
    setIsLoadingCart(true);
    setTimeout(() => {
      setShowCart(true);
      setIsLoadingCart(false);
    }, 300);
  };

  // Handle pinch gestures: click on release without movement, scroll on pinch + move
  useEffect(() => {
    if (!handPositions.length || !gestureStates.length) return;

    const gesture = gestureStates[0];
    const hand = handPositions[0];
    if (!hand || !gesture) return;

    const wasPinching = lastPinchStateRef.current[0] || false;
    const isPinching = gesture.isPinching || false;

    if (isPinching && !wasPinching) {
      // Pinch started - store position
      pinchStartPositionRef.current = { x: hand.x, y: hand.y };
      console.log('[KIOSK] Pinch started at', hand.x, hand.y);
    } else if (isPinching && wasPinching && pinchStartPositionRef.current) {
      // Pinch + move = scroll
      const deltaY = (hand.y - pinchStartPositionRef.current.y) * window.innerHeight;
      
      // Scroll threshold - only scroll if moved more than 5px
      if (Math.abs(deltaY) > 5 && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop -= deltaY * 2; // Amplify scroll
        pinchStartPositionRef.current = { x: hand.x, y: hand.y };
        console.log('[KIOSK] Scrolling', deltaY);
      }
    } else if (!isPinching && wasPinching && pinchStartPositionRef.current) {
      // Pinch released - check if it was a click (no significant movement)
      const deltaX = Math.abs(hand.x - pinchStartPositionRef.current.x) * window.innerWidth;
      const deltaY = Math.abs(hand.y - pinchStartPositionRef.current.y) * window.innerHeight;
      
      console.log('[KIOSK] Pinch released - deltaX:', deltaX, 'deltaY:', deltaY);
      
      // If movement is less than 15px, treat as click
      if (deltaX < 15 && deltaY < 15) {
        // Use the pinch START position for click detection
        const x = pinchStartPositionRef.current.x * window.innerWidth;
        const y = pinchStartPositionRef.current.y * window.innerHeight;

        console.log('[KIOSK] Attempting click at', x, y);
        
        // Get all elements at point and find the clickable one
        const elements = document.elementsFromPoint(x, y);
        console.log('[KIOSK] Elements at point:', elements.map(e => e.tagName + (e.id ? '#' + e.id : '')));
        
        let clickableElement: HTMLElement | null = null;
        for (const el of elements) {
          if (el instanceof HTMLElement) {
            const clickable = el.closest('button, [data-clickable], a');
            if (clickable instanceof HTMLElement) {
              clickableElement = clickable;
              break;
            }
          }
        }
        
        if (clickableElement) {
          console.log('[KIOSK] Clicking element:', clickableElement.id || clickableElement.getAttribute('data-id'));
          clickableElement.click();
        } else {
          console.log('[KIOSK] No clickable element found');
        }
      } else {
        console.log('[KIOSK] Movement too large for click');
      }
      
      pinchStartPositionRef.current = null;
    }

    lastPinchStateRef.current[0] = isPinching;
  }, [handPositions, gestureStates]);

  // Detect hover - check all elements at point
  useEffect(() => {
    if (!handPositions.length) {
      setHoveredElement(null);
      return;
    }

    const hand = handPositions[0];
    const x = hand.x * window.innerWidth;
    const y = hand.y * window.innerHeight;

    // Get all elements at this point to find the interactive one
    const elements = document.elementsFromPoint(x, y);
    let foundId: string | null = null;
    
    for (const element of elements) {
      if (element instanceof HTMLElement) {
        // Check if it's a clickable element
        const clickable = element.closest('button, [data-clickable]');
        if (clickable instanceof HTMLElement) {
          foundId = clickable.id || clickable.getAttribute('data-id') || null;
          break;
        }
      }
    }
    
    setHoveredElement(foundId);
  }, [handPositions]);

  const addToCart = (item: MenuItem) => {
    setClickedElement(`item-${item.id}`);
    setTimeout(() => setClickedElement(null), 300);
    
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
    setIsLoadingCheckout(true);
    setTimeout(() => {
      toast({
        title: "Order placed!",
        description: `Total: $${getTotal()}. Thank you for your order!`,
      });
      setCart([]);
      setShowCart(false);
      setIsLoadingCheckout(false);
    }, 800);
  };

  const filteredItems = MENU_ITEMS.filter(item => item.category === selectedCategory);

  return (
    <div className="h-full w-full max-w-2xl mx-auto bg-background flex flex-col relative cursor-none py-8 px-6">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-8 text-center mb-6 rounded-[2rem]">
        <h1 className="text-4xl font-bold mb-2">Order Here</h1>
        <p className="text-lg opacity-90">Touch to select items</p>
      </div>

      {/* Category Carousel */}
      <div className="relative p-6 bg-muted/30 mb-6 rounded-[2rem]">
        <Button
          id="category-prev"
          data-id="category-prev"
          variant="ghost"
          size="icon"
          onClick={scrollPrev}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 transition-all ${
            hoveredElement === 'category-prev' ? 'scale-110 shadow-lg' : ''
          }`}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3">
            {categories.map(cat => (
              <Button
                key={cat}
                id={`category-${cat}`}
                data-id={`category-${cat}`}
                onClick={() => handleCategoryChange(cat)}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`h-14 px-8 text-base font-semibold capitalize transition-all flex-shrink-0 ${
                  hoveredElement === `category-${cat}` ? 'scale-105 shadow-lg' : ''
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <Button
          id="category-next"
          data-id="category-next"
          variant="ghost"
          size="icon"
          onClick={scrollNext}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 transition-all ${
            hoveredElement === 'category-next' ? 'scale-110 shadow-lg' : ''
          }`}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Menu Items */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 mb-6">
        {isLoadingCategory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
              <p className="text-lg font-medium text-muted-foreground">Loading menu...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 animate-fade-in">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                id={`item-${item.id}`}
                data-id={`item-${item.id}`}
                data-clickable="true"
                className={`p-6 transition-all duration-200 ${
                  clickedElement === `item-${item.id}`
                    ? 'scale-95 shadow-2xl border-primary'
                    : hoveredElement === `item-${item.id}` 
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
        )}
      </div>

      {/* Cart Button */}
      <div className="px-6 py-6 bg-muted/30 border-t rounded-t-[2rem]">
        <Button
          id="cart-button"
          data-id="cart-button"
          onClick={handleViewCart}
          disabled={isLoadingCart}
          className={`w-full h-16 text-lg font-bold relative transition-all ${
            hoveredElement === 'cart-button' ? 'scale-105 shadow-xl' : ''
          }`}
          size="lg"
        >
          {isLoadingCart ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent mr-2"></div>
              Loading...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-6 w-6" />
              View Cart ({cart.length} items) - ${getTotal()}
            </>
          )}
        </Button>
      </div>

      {/* Cart Overlay */}
      {showCart && (
        <div className="absolute inset-0 bg-background z-10 flex flex-col p-6">
          <div className="bg-primary text-primary-foreground p-8 flex items-center justify-between mb-6 rounded-[2rem]">
            <h2 className="text-3xl font-bold">Your Cart</h2>
            <Button
              id="close-cart"
              data-id="close-cart"
              variant="ghost"
              size="icon"
              onClick={() => setShowCart(false)}
              className={`text-primary-foreground hover:bg-primary-foreground/20 transition-all h-12 w-12 ${
                hoveredElement === 'close-cart' ? 'scale-110 bg-primary-foreground/20' : ''
              }`}
            >
              <X className="h-8 w-8" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 mb-6">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <Card key={item.id} className="p-6">
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
                          className={`h-12 w-12 transition-all ${
                            hoveredElement === `minus-${item.id}` ? 'scale-110 shadow-lg' : ''
                          }`}
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className="text-xl font-bold w-8 text-center">{item.quantity}</span>
                        <Button
                          id={`plus-${item.id}`}
                          data-id={`plus-${item.id}`}
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, 1)}
                          className={`h-12 w-12 transition-all ${
                            hoveredElement === `plus-${item.id}` ? 'scale-110 shadow-lg' : ''
                          }`}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                        <Button
                          id={`remove-${item.id}`}
                          data-id={`remove-${item.id}`}
                          variant="destructive"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className={`h-12 w-12 transition-all ${
                            hoveredElement === `remove-${item.id}` ? 'scale-110 shadow-lg' : ''
                          }`}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="p-8 bg-muted/30 border-t space-y-4 rounded-[2rem]">
            <div className="flex justify-between items-center text-2xl font-bold">
              <span>Total:</span>
              <span className="text-primary">${getTotal()}</span>
            </div>
            <Button
              id="checkout-button"
              data-id="checkout-button"
              onClick={handleCheckout}
              disabled={isLoadingCheckout}
              className={`w-full h-16 text-xl font-bold transition-all ${
                hoveredElement === 'checkout-button' ? 'scale-105 shadow-xl' : ''
              }`}
              size="lg"
            >
              {isLoadingCheckout ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                  Processing...
                </>
              ) : (
                'Checkout'
              )}
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
            className="fixed rounded-full pointer-events-none z-[60] transition-all duration-150"
            style={{
              left: `${hand.x * 100}%`,
              top: `${hand.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: isPinching ? '20px' : '32px',
              height: isPinching ? '20px' : '32px',
              backgroundColor: isPinching ? 'hsl(var(--primary) / 0.8)' : 'hsl(var(--primary) / 0.5)',
              border: '3px solid hsl(var(--primary))',
              boxShadow: isPinching ? '0 0 20px hsl(var(--primary))' : 'none',
            }}
          />
        );
      })}
    </div>
  );
};
