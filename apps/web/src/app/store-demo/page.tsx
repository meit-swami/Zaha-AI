"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingBag, ScanLine, Home, Heart, Search, ChevronLeft, Gem, Shirt } from 'lucide-react';
import VirtualMirror from '@/components/ar/virtual-mirror';

const PRODUCTS = [
    // Sarees
    {
        id: 1,
        name: "Ocean Breeze Silk Saree",
        price: "₹37,500",
        category: "Sarees",
        images: [
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop"
        ],
        type: "apparel"
    },
    {
        id: 2,
        name: "Royal Banarasi Saree",
        price: "₹85,000",
        category: "Sarees",
        images: [
            "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=600&auto=format&fit=crop"
        ],
        type: "apparel"
    },
    {
        id: 3,
        name: "Kanjivaram Heritage Saree",
        price: "₹1,25,000",
        category: "Sarees",
        images: [
            "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop"
        ],
        type: "apparel"
    },

    // Lehengas
    {
        id: 4,
        name: "Royal Velvet Lehenga",
        price: "₹74,150",
        category: "Lehengas",
        images: [
            "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop"
        ],
        type: "apparel"
    },
    {
        id: 5,
        name: "Bridal Red Lehenga",
        price: "₹2,50,000",
        category: "Lehengas",
        images: [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=600&auto=format&fit=crop"
        ],
        type: "apparel"
    },
    {
        id: 6,
        name: "Pastel Dream Lehenga",
        price: "₹1,45,000",
        category: "Lehengas",
        images: [
            "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop"
        ],
        type: "apparel"
    },

    // Jewellery
    {
        id: 7,
        name: "Emerald Oasis Set",
        price: "₹1,08,250",
        category: "Jewellery",
        images: [
            "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop"
        ],
        type: "jewelry"
    },
    {
        id: 8,
        name: "Diamond Solitaire Pendant",
        price: "₹2,00,000",
        category: "Jewellery",
        images: [
            "https://images.unsplash.com/photo-1515562141207-7a88fb0537bf?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop"
        ],
        type: "jewelry"
    },
    {
        id: 9,
        name: "Gold Temple Necklace",
        price: "₹3,50,000",
        category: "Jewellery",
        images: [
            "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1515562141207-7a88fb0537bf?q=80&w=600&auto=format&fit=crop"
        ],
        type: "jewelry"
    },

    // Men's Shirts
    {
        id: 10,
        name: "Premium Linen Shirt",
        price: "₹4,500",
        category: "Men's Wear",
        images: [
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop"
        ],
        type: "apparel"
    },
    {
        id: 11,
        name: "Formal White Shirt",
        price: "₹3,200",
        category: "Men's Wear",
        images: [
            "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop"
        ],
        type: "apparel"
    },

    // Men's Pants
    {
        id: 12,
        name: "Tailored Chinos",
        price: "₹5,500",
        category: "Men's Wear",
        images: [
            "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=600&auto=format&fit=crop"
        ],
        type: "apparel"
    },

    // Watches
    {
        id: 13,
        name: "Luxury Chronograph Watch",
        price: "₹1,85,000",
        category: "Accessories",
        images: [
            "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=600&auto=format&fit=crop"
        ],
        type: "jewelry"
    },
    {
        id: 14,
        name: "Classic Leather Watch",
        price: "₹45,000",
        category: "Accessories",
        images: [
            "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&auto=format&fit=crop"
        ],
        type: "jewelry"
    },

    // Eyewear
    {
        id: 15,
        name: "Aviator Sunglasses",
        price: "₹12,500",
        category: "Accessories",
        images: [
            "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600&auto=format&fit=crop"
        ],
        type: "jewelry"
    },
    {
        id: 16,
        name: "Designer Optical Frames",
        price: "₹18,000",
        category: "Accessories",
        images: [
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600&auto=format&fit=crop"
        ],
        type: "jewelry"
    }
];

const CATEGORIES = ['All', 'Sarees', 'Lehengas', 'Jewellery', 'Men\'s Wear', 'Accessories'];

function ProductCard({ product, onTryOn }: { product: typeof PRODUCTS[0], onTryOn: () => void }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (product.images.length > 1) {
            let index = 0;
            intervalRef.current = setInterval(() => {
                index = (index + 1) % product.images.length;
                setCurrentImageIndex(index);
            }, 1000);
        }
    };

    const handleMouseLeave = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setCurrentImageIndex(0);
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    return (
        <div
            className="group bg-white rounded-3xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={onTryOn}
        >
            <div
                className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-gray-100"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {product.images.map((image, idx) => (
                    <img
                        key={idx}
                        src={image}
                        alt={`${product.name} - ${idx + 1}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${idx === currentImageIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                    />
                ))}

                <button
                    className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white hover:text-red-500 transition-colors z-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Add to wishlist logic here
                    }}
                >
                    <Heart className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-1">
                <span className="text-xs font-bold text-accent tracking-widest uppercase">{product.category}</span>
                <h3 className="font-serif text-lg font-bold text-dark truncate">{product.name}</h3>
                <p className="text-gray-600 font-medium">{product.price}</p>
            </div>
        </div>
    );
}

export default function StoreDemo() {
    const [mirrorMode, setMirrorMode] = useState<'jewelry' | 'apparel' | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredProducts = selectedCategory === 'All'
        ? PRODUCTS
        : PRODUCTS.filter(p => p.category === selectedCategory);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-dark">
            {/* Mobile/Tablet Sidebar Navigation */}
            <nav className="w-full md:w-20 bg-prime-dark text-white flex md:flex-col items-center justify-between py-4 px-6 md:px-0 fixed bottom-0 md:relative z-40 md:h-screen shadow-2xl">
                <div className="hidden md:block mb-8 mt-4">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center font-serif text-xl font-bold">Z</div>
                </div>

                <div className="flex md:flex-col justify-around w-full md:space-y-8">
                    <Link href="/" className="p-3 bg-white/10 rounded-xl text-accent"><Home className="w-6 h-6" /></Link>
                    <button className="p-3 hover:bg-white/5 rounded-xl text-white/70"><Search className="w-6 h-6" /></button>
                    <button className="p-3 hover:bg-white/5 rounded-xl text-white/70"><Heart className="w-6 h-6" /></button>
                    <button className="p-3 hover:bg-white/5 rounded-xl text-white/70"><ShoppingBag className="w-6 h-6" /></button>
                </div>

                <div className="hidden md:block mb-8">
                    <div className="w-10 h-10 border border-white/20 rounded-full overflow-hidden">
                        <img src="https://i.pravatar.cc/100?img=5" alt="Profile" />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 mb-20 md:mb-0 overflow-y-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="font-serif text-4xl text-prime-dark font-bold mb-2">New Arrivals</h1>
                        <p className="text-gray-500 font-sans tracking-wide text-sm">CURATED FOR YOU • SUMMER 2026</p>
                    </div>
                </header>

                {/* Filters */}
                <div className="flex space-x-4 mb-8 overflow-x-auto pb-4">
                    {CATEGORIES.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                                    ? 'bg-dark text-white'
                                    : 'bg-white border text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onTryOn={() => setMirrorMode(product.type as any)}
                        />
                    ))}
                </div>
            </main>

            {/* Virtual Mirror Modal */}
            {mirrorMode && (
                <VirtualMirror
                    onClose={() => setMirrorMode(null)}
                    mode={mirrorMode}
                />
            )}
        </div>
    );
}
