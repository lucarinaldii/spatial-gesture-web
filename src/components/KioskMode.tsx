import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Minus, ShoppingCart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GestureState, HandPosition } from '@/hooks/useHandTracking';
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
  showCursor: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Classic Burger', price: 8.99, category: 'burgers', image: '🍔' },
  { id: '2', name: 'Cheese Burger', price: 9.99, category: 'burgers', image: '🍔' },
  { id: '3', name: 'Chicken Burger', price: 10.99, category: 'burgers', image: '🍗' },
  { id: '4', name: 'Veggie Burger', price: 8.49, category: 'burgers', image: '🥗' },
  { id: '5', name: 'Double Burger', price: 11.99, category: 'burgers', image: '🍔' },
  { id: '6', name: 'Bacon Burger', price: 10.49, category: 'burgers', image: '🥓' },
  { id: '7', name: 'BBQ Burger', price: 10.99, category: 'burgers', image: '🍔' },
  { id: '8', name: 'Spicy Burger', price: 9.49, category: 'burgers', image: '🌶️' },
  
  { id: '9', name: 'French Fries', price: 3.99, category: 'sides', image: '🍟' },
  { id: '10', name: 'Onion Rings', price: 4.49, category: 'sides', image: '🧅' },
  { id: '11', name: 'Chicken Nuggets', price: 5.99, category: 'sides', image: '🍗' },
  { id: '12', name: 'Mozzarella Sticks', price: 5.49, category: 'sides', image: '🧀' },
  { id: '13', name: 'Sweet Potato Fries', price: 4.49, category: 'sides', image: '🍠' },
  { id: '14', name: 'Garlic Bread', price: 3.49, category: 'sides', image: '🥖' },
  { id: '15', name: 'Wings', price: 6.99, category: 'sides', image: '🍗' },
  { id: '16', name: 'Loaded Fries', price: 5.99, category: 'sides', image: '🍟' },
  
  { id: '17', name: 'Cola', price: 2.49, category: 'drinks', image: '🥤' },
  { id: '18', name: 'Lemonade', price: 2.99, category: 'drinks', image: '🍋' },
  { id: '19', name: 'Milkshake', price: 4.99, category: 'drinks', image: '🥤' },
  { id: '20', name: 'Iced Tea', price: 2.49, category: 'drinks', image: '🧋' },
  { id: '21', name: 'Orange Juice', price: 3.49, category: 'drinks', image: '🍊' },
  { id: '22', name: 'Smoothie', price: 4.99, category: 'drinks', image: '🥤' },
  { id: '23', name: 'Water', price: 1.99, category: 'drinks', image: '💧' },
  { id: '24', name: 'Energy Drink', price: 3.99, category: 'drinks', image: '⚡' },
  
  { id: '25', name: 'Ice Cream', price: 3.49, category: 'desserts', image: '🍦' },
  { id: '26', name: 'Apple Pie', price: 2.99, category: 'desserts', image: '🥧' },
  { id: '27', name: 'Brownie', price: 3.99, category: 'desserts', image: '🍫' },
  { id: '28', name: 'Cheesecake', price: 4.99, category: 'desserts', image: '🍰' },
  { id: '29', name: 'Cookies', price: 2.49, category: 'desserts', image: '🍪' },
  { id: '30', name: 'Donut', price: 2.99, category: 'desserts', image: '🍩' },
  { id: '31', name: 'Sundae', price: 4.49, category: 'desserts', image: '🍨' },
  { id: '32', name: 'Cupcake', price: 3.49, category: 'desserts', image: '🧁' },
  
  { id: '33', name: 'Caesar Salad', price: 7.99, category: 'salads', image: '🥗' },
  { id: '34', name: 'Greek Salad', price: 8.49, category: 'salads', image: '🥗' },
  { id: '35', name: 'Garden Salad', price: 6.99, category: 'salads', image: '🥗' },
  { id: '36', name: 'Chicken Salad', price: 9.49, category: 'salads', image: '🥗' },
  { id: '37', name: 'Cobb Salad', price: 9.99, category: 'salads', image: '🥗' },
  { id: '38', name: 'Taco Salad', price: 8.99, category: 'salads', image: '🌮' },
  
  { id: '39', name: 'Pancakes', price: 6.99, category: 'breakfast', image: '🥞' },
  { id: '40', name: 'Eggs & Bacon', price: 7.99, category: 'breakfast', image: '🍳' },
  { id: '41', name: 'Breakfast Burrito', price: 8.49, category: 'breakfast', image: '🌯' },
  { id: '42', name: 'French Toast', price: 7.49, category: 'breakfast', image: '🍞' },
  { id: '43', name: 'Omelette', price: 8.99, category: 'breakfast', image: '🍳' },
  { id: '44', name: 'Waffles', price: 7.99, category: 'breakfast', image: '🧇' },
  { id: '45', name: 'Bagel', price: 3.99, category: 'breakfast', image: '🥯' },
  { id: '46', name: 'Croissant', price: 4.49, category: 'breakfast', image: '🥐' },
  
  { id: '47', name: 'Nachos', price: 5.99, category: 'snacks', image: '🧀' },
  { id: '48', name: 'Popcorn', price: 3.49, category: 'snacks', image: '🍿' },
  { id: '49', name: 'Pretzel', price: 3.99, category: 'snacks', image: '🥨' },
  { id: '50', name: 'Chips', price: 2.99, category: 'snacks', image: '🥔' },
  { id: '51', name: 'Churros', price: 4.49, category: 'snacks', image: '🥖' },
  { id: '52', name: 'Quesadilla', price: 6.49, category: 'snacks', image: '🌮' },
  
  { id: '53', name: 'Espresso', price: 2.99, category: 'coffee', image: '☕' },
  { id: '54', name: 'Cappuccino', price: 3.99, category: 'coffee', image: '☕' },
  { id: '55', name: 'Latte', price: 4.49, category: 'coffee', image: '☕' },
  { id: '56', name: 'Americano', price: 3.49, category: 'coffee', image: '☕' },
  { id: '57', name: 'Mocha', price: 4.99, category: 'coffee', image: '☕' },
  { id: '58', name: 'Macchiato', price: 4.49, category: 'coffee', image: '☕' },
  { id: '59', name: 'Iced Coffee', price: 3.99, category: 'coffee', image: '🧊' },
  { id: '60', name: 'Frappuccino', price: 5.49, category: 'coffee', image: '🥤' },
  
  { id: '61', name: 'BBQ Ribs', price: 14.99, category: 'burgers', image: '🍖' },
  { id: '62', name: 'Fish Burger', price: 11.49, category: 'burgers', image: '🐟' },
  { id: '63', name: 'Turkey Burger', price: 10.49, category: 'burgers', image: '🦃' },
  { id: '64', name: 'Mushroom Burger', price: 9.99, category: 'burgers', image: '🍄' },
  
  { id: '65', name: 'Coleslaw', price: 3.49, category: 'sides', image: '🥗' },
  { id: '66', name: 'Mac & Cheese', price: 4.99, category: 'sides', image: '🧀' },
  { id: '67', name: 'Corn on the Cob', price: 3.99, category: 'sides', image: '🌽' },
  { id: '68', name: 'Hash Browns', price: 3.49, category: 'sides', image: '🥔' },
  
  { id: '69', name: 'Hot Chocolate', price: 3.49, category: 'drinks', image: '☕' },
  { id: '70', name: 'Fruit Punch', price: 2.99, category: 'drinks', image: '🍹' },
  { id: '71', name: 'Sparkling Water', price: 2.49, category: 'drinks', image: '💧' },
  { id: '72', name: 'Root Beer Float', price: 4.49, category: 'drinks', image: '🥤' },
  
  { id: '73', name: 'Tiramisu', price: 5.49, category: 'desserts', image: '🍰' },
  { id: '74', name: 'Pudding', price: 3.49, category: 'desserts', image: '🍮' },
  { id: '75', name: 'Muffin', price: 2.99, category: 'desserts', image: '🧁' },
  { id: '76', name: 'Cinnamon Roll', price: 3.99, category: 'desserts', image: '🥐' },
  
  { id: '77', name: 'Caprese Salad', price: 8.99, category: 'salads', image: '🥗' },
  { id: '78', name: 'Asian Salad', price: 9.49, category: 'salads', image: '🥗' },
  { id: '79', name: 'Quinoa Bowl', price: 10.49, category: 'salads', image: '🥗' },
  { id: '80', name: 'Spinach Salad', price: 8.49, category: 'salads', image: '🥗' },
  
  { id: '81', name: 'Breakfast Sandwich', price: 5.99, category: 'breakfast', image: '🥪' },
  { id: '82', name: 'Yogurt Parfait', price: 4.99, category: 'breakfast', image: '🥤' },
  { id: '83', name: 'Breakfast Bowl', price: 8.99, category: 'breakfast', image: '🥣' },
  { id: '84', name: 'Smoothie Bowl', price: 7.49, category: 'breakfast', image: '🥣' },
  
  { id: '85', name: 'Spring Rolls', price: 5.49, category: 'snacks', image: '🥟' },
  { id: '86', name: 'Jalapeno Poppers', price: 5.99, category: 'snacks', image: '🌶️' },
  { id: '87', name: 'Mini Tacos', price: 6.49, category: 'snacks', image: '🌮' },
  { id: '88', name: 'Sliders', price: 7.99, category: 'snacks', image: '🍔' },
  
  { id: '89', name: 'Cold Brew', price: 4.49, category: 'coffee', image: '🧊' },
  { id: '90', name: 'Flat White', price: 4.29, category: 'coffee', image: '☕' },
  { id: '91', name: 'Cortado', price: 3.79, category: 'coffee', image: '☕' },
  { id: '92', name: 'Affogato', price: 5.49, category: 'coffee', image: '🍦' },
];

export const KioskMode = ({ handPositions, gestureStates, showCursor }: KioskModeProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('burgers');
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [clickedElement, setClickedElement] = useState<string | null>(null);
  const [addedItemId, setAddedItemId] = useState<string | null>(null);
  const [scrollLine, setScrollLine] = useState<{ startY: number; currentY: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isCarouselScrolling, setIsCarouselScrolling] = useState(false);
  const lastPinchStateRef = useRef<boolean[]>([]);
  const pinchStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const carouselPinchStartRef = useRef<{ x: number; y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const carouselContainerRef = useRef<HTMLDivElement>(null);
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

  // Handle pinch gestures for scrolling
  useEffect(() => {
    if (!handPositions.length || !gestureStates.length) return;

    // Find any hand that's pinching (check both hands)
    let hand = null;
    let gesture = null;
    for (let i = 0; i < Math.min(handPositions.length, gestureStates.length); i++) {
      if (gestureStates[i]?.isPinching) {
        hand = handPositions[i];
        gesture = gestureStates[i];
        break;
      }
    }
    
    // If no hand is pinching, use first hand for position tracking
    if (!hand && handPositions.length > 0) {
      hand = handPositions[0];
      gesture = gestureStates[0];
    }
    
    if (!hand || !gesture) return;

    const x = hand.x * window.innerWidth;
    const y = hand.y * window.innerHeight;
    
    // Check if hand is over the carousel area
    const isOverCarousel = carouselContainerRef.current && 
      y >= carouselContainerRef.current.offsetTop && 
      y <= carouselContainerRef.current.offsetTop + carouselContainerRef.current.offsetHeight;

    const wasPinching = lastPinchStateRef.current[0] || false;
    const isPinching = gesture.isPinching || false;

    // Handle carousel horizontal scrolling
    if (isOverCarousel && emblaApi) {
      if (isPinching && !wasPinching) {
        // Start carousel scroll
        carouselPinchStartRef.current = { x: hand.x, y: hand.y };
        setIsCarouselScrolling(false);
      } else if (isPinching && wasPinching && carouselPinchStartRef.current) {
        // Horizontal scroll on carousel
        const deltaX = (hand.x - carouselPinchStartRef.current.x) * window.innerWidth;
        
        // Scroll threshold - only scroll if moved more than 20px
        if (Math.abs(deltaX) > 20) {
          // Direct scroll for responsive feel (same as vertical)
          const container = emblaApi.containerNode();
          if (container) {
            const currentScroll = container.scrollLeft;
            const scrollDelta = deltaX * 1.2;
            container.scrollLeft = currentScroll - scrollDelta;
          }
          
          carouselPinchStartRef.current = { x: hand.x, y: hand.y };
          setIsCarouselScrolling(true);
        }
      } else if (!isPinching && wasPinching && carouselPinchStartRef.current) {
        // Carousel pinch released
        const deltaX = Math.abs(hand.x - carouselPinchStartRef.current.x) * window.innerWidth;
        const deltaY = Math.abs(hand.y - carouselPinchStartRef.current.y) * window.innerHeight;
        
        // Only trigger click if no scrolling and minimal movement
        if (!isCarouselScrolling && deltaX < 50 && deltaY < 50) {
          const elements = document.elementsFromPoint(
            carouselPinchStartRef.current.x * window.innerWidth, 
            carouselPinchStartRef.current.y * window.innerHeight
          );
          let clickableElement: HTMLElement | null = null;
          for (const el of elements) {
            if (el instanceof HTMLElement) {
              const clickable = el.closest('button, [data-clickable]');
              if (clickable instanceof HTMLElement) {
                clickableElement = clickable;
                break;
              }
            }
          }
          if (clickableElement) clickableElement.click();
        }
        
        carouselPinchStartRef.current = null;
        setTimeout(() => setIsCarouselScrolling(false), 100);
      }
    }

    // Handle main content vertical scrolling
    if (!isOverCarousel) {
      if (isPinching && !wasPinching) {
        // Pinch started - store position
        pinchStartPositionRef.current = { x: hand.x, y: hand.y };
        setScrollLine({ startY: hand.y * window.innerHeight, currentY: hand.y * window.innerHeight });
        setIsScrolling(false);
      } else if (isPinching && wasPinching && pinchStartPositionRef.current) {
        // Pinch + move = scroll
        const deltaY = (hand.y - pinchStartPositionRef.current.y) * window.innerHeight;
        
        // Update scroll line
        setScrollLine({ 
          startY: pinchStartPositionRef.current.y * window.innerHeight, 
          currentY: hand.y * window.innerHeight 
        });
        
        // Scroll threshold - only scroll if moved more than 20px
        if (Math.abs(deltaY) > 20 && scrollContainerRef.current) {
          // Direct scroll for responsive feel
          const currentScroll = scrollContainerRef.current.scrollTop;
          const scrollDelta = deltaY * 1.2;
          scrollContainerRef.current.scrollTop = currentScroll - scrollDelta;
          
          pinchStartPositionRef.current = { x: hand.x, y: hand.y };
          setIsScrolling(true);
        }
      } else if (!isPinching && wasPinching && pinchStartPositionRef.current) {
        // Pinch released - clear scroll line
        setScrollLine(null);
        
        // Pinch released - check if it was a click (no significant movement)
        const deltaX = Math.abs(hand.x - pinchStartPositionRef.current.x) * window.innerWidth;
        const deltaY = Math.abs(hand.y - pinchStartPositionRef.current.y) * window.innerHeight;
        
        // Only trigger click if no scrolling occurred and movement under 40px
        if (!isScrolling && deltaX < 40 && deltaY < 40) {
          // Use the pinch START position for click detection
          const x = pinchStartPositionRef.current.x * window.innerWidth;
          const y = pinchStartPositionRef.current.y * window.innerHeight;
          
          // Get all elements at point and find the clickable one
          const elements = document.elementsFromPoint(x, y);
          
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
            clickableElement.click();
          }
        }
        
        pinchStartPositionRef.current = null;
        // Reset scrolling flag after a short delay
        setTimeout(() => setIsScrolling(false), 100);
      }
    }

    lastPinchStateRef.current[0] = isPinching || false;
  }, [handPositions, gestureStates, emblaApi]);

  // Detect hover - check all elements at point (use any hand position)
  useEffect(() => {
    if (!handPositions.length) {
      setHoveredElement(null);
      return;
    }

    // Use the first available hand for hover detection
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
    // Prevent adding to cart if scrolling just occurred
    if (isScrolling) {
      console.log('[KIOSK] Prevented add to cart - scrolling detected');
      return;
    }
    
    setClickedElement(`item-${item.id}`);
    setTimeout(() => setClickedElement(null), 300);
    
    setAddedItemId(item.id);
    setTimeout(() => setAddedItemId(null), 800);
    
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
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
      return;
    }
    setIsLoadingCheckout(true);
    setTimeout(() => {
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
      <div ref={carouselContainerRef} className="relative p-6 bg-muted/30 mb-6 rounded-[2rem]">
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
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto px-6 mb-6"
      >
        {isLoadingCategory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
              <p className="text-lg font-medium text-muted-foreground">Loading menu...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6 animate-fade-in">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                id={`item-${item.id}`}
                data-id={`item-${item.id}`}
                data-clickable="true"
                className={`p-6 transition-all duration-200 relative ${
                  clickedElement === `item-${item.id}`
                    ? 'scale-95 shadow-2xl border-primary'
                    : hoveredElement === `item-${item.id}` 
                    ? 'shadow-xl scale-105 border-primary' 
                    : 'hover:shadow-lg'
                }`}
                style={addedItemId === item.id ? {
                  boxShadow: 'inset 0 0 0 4px rgb(34 197 94), 0 25px 50px -12px rgba(0,0,0,0.25)'
                } : undefined}
                onClick={() => addToCart(item)}
              >
                <div className={`transition-opacity duration-300 ${addedItemId === item.id ? 'opacity-20' : 'opacity-100'}`}>
                  <div className="text-6xl text-center mb-3">{item.image}</div>
                  <h3 className="font-semibold text-center mb-2">{item.name}</h3>
                  <p className="text-2xl font-bold text-center text-primary">
                    ${item.price.toFixed(2)}
                  </p>
                </div>
                
                {addedItemId === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] animate-fade-in">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 blur-2xl opacity-50"></div>
                      <div className="relative text-5xl text-green-500 font-bold">✓</div>
                    </div>
                  </div>
                )}
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
              View Cart {cart.length > 0 && `(${cart.length})`}
            </>
          )}
        </Button>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
          <div className="bg-background border rounded-[2rem] p-8 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Your Cart</h2>
              <Button
                id="close-cart"
                data-id="close-cart"
                variant="ghost"
                size="icon"
                onClick={() => setShowCart(false)}
                className={`transition-all ${
                  hoveredElement === 'close-cart' ? 'scale-110 shadow-lg' : ''
                }`}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto mb-6 space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Your cart is empty</p>
              ) : (
                cart.map(item => (
                  <Card key={item.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-4xl">{item.image}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <p className="text-primary font-bold">${item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <Button
                            id={`decrease-${item.id}`}
                            data-id={`decrease-${item.id}`}
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className={`h-10 w-10 transition-all ${
                              hoveredElement === `decrease-${item.id}` ? 'scale-110 shadow-lg' : ''
                            }`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-xl font-bold w-12 text-center">{item.quantity}</span>
                          <Button
                            id={`increase-${item.id}`}
                            data-id={`increase-${item.id}`}
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className={`h-10 w-10 transition-all ${
                              hoveredElement === `increase-${item.id}` ? 'scale-110 shadow-lg' : ''
                            }`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                          id={`remove-${item.id}`}
                          data-id={`remove-${item.id}`}
                          variant="destructive"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className={`h-10 w-10 transition-all ${
                            hoveredElement === `remove-${item.id}` ? 'scale-110 shadow-lg' : ''
                          }`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

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

      {/* Hand cursor indicators - above everything - only show first hand */}
      {showCursor && handPositions.length > 0 && handPositions.slice(0, 1).map((hand, index) => {
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
      
      {/* Scroll line indicator */}
      {showCursor && scrollLine && (
        <svg 
          className="fixed inset-0 pointer-events-none z-[59]" 
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="scrollLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <line
            x1="50%"
            y1={scrollLine.startY}
            x2="50%"
            y2={scrollLine.currentY}
            stroke="url(#scrollLineGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="10,5"
          />
          <circle
            cx="50%"
            cy={scrollLine.startY}
            r="6"
            fill="hsl(var(--primary))"
            opacity="0.6"
          />
        </svg>
      )}
    </div>
  );
};
