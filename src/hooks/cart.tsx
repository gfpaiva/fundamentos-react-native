import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CART_STORAGE_KEY = 'GoMarketPlace@Cart';

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(CART_STORAGE_KEY);

      setProducts(JSON.parse(storageProducts));
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function setProductsInStorage(): Promise<void> {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(products));
    }

    setProductsInStorage();
  }, [products]);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const productExists = products.some(({ id }) => product.id === id);

      if (productExists) {
        const newProducts = products.map(stateProduct => {
          if (product.id === stateProduct.id) {
            return {
              ...stateProduct,
              quantity: stateProduct.quantity + 1,
            };
          }

          return stateProduct;
        });

        setProducts(newProducts);
      } else {
        setProducts([
          ...products,
          {
            ...product,
            quantity: 1,
          },
        ]);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(stateProduct => {
        if (id === stateProduct.id) {
          return {
            ...stateProduct,
            quantity: stateProduct.quantity + 1,
          };
        }

        return stateProduct;
      });

      setProducts(newProducts);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = products
        .map(stateProduct => {
          if (id === stateProduct.id && stateProduct.quantity > 1) {
            return {
              ...stateProduct,
              quantity: stateProduct.quantity - 1,
            };
          }

          return stateProduct;
        })
        .filter(stateProduct => !!stateProduct);

      setProducts(newProducts);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
