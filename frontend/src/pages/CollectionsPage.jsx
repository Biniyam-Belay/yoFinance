import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, RefreshCw, Clock, Loader2, Store } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../services/productApi';
import ProductCard from '../components/ui/ProductCard';
import { Input } from "../components/ui/input"; // Import Input
import { Button } from "../components/ui/button"; // Import Button
import { Helmet } from 'react-helmet';
import { supabase } from "../services/supabaseClient.js"; // Import supabase

// Fetch public collections from API
const fetchPublicCollections = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-public-collections');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching public collections:', error);
    // Return empty array for now - let the static collections show
    return [];
  }
};

// Define the Supabase placeholder image URL
const SUPABASE_PLACEHOLDER_IMAGE_URL = supabase.storage.from("public_assets").getPublicUrl("placeholder.webp").data?.publicUrl || "/fallback-placeholder.svg";
const SUPABASE_SIGNATURE_IMAGE_URL = supabase.storage.from("public_assets").getPublicUrl("signature.webp").data?.publicUrl || "/fallback-signature.svg"; // Fallback if Supabase URL construction fails

const collections = [
  {
    id: "signature",
    name: "Signature Collection",
    description: "Handcrafted luxury essentials. Timeless pieces for the modern wardrobe.",
    image: "/images/hero-2.jpg",
    highlight: "New Season",
    cta: "Explore Collection",
    url: "/collections/signature",
    badge: "Up to 30% Off"
  },
  {
    id: "minimalist",
    name: "Minimalist Edit",
    description: "Sleek, versatile, and designed for everyday elegance.",
    image: "/images/tshirt-blue.jpg",
    highlight: "Minimalist",
    cta: "Shop Minimalist",
    url: "/collections/minimalist",
    badge: "Best Seller"
  },
  {
    id: "tech",
    name: "Tech Essentials",
    description: "Smart accessories for a connected lifestyle.",
    image: "/images/smartwatch.jpg",
    highlight: "Tech",
    cta: "Shop Tech",
    url: "/collections/tech",
    badge: "Just Arrived"
  }
];

const featureIcons = [
  {
    icon: <ShoppingBag className="h-6 w-6" />, label: "Free Shipping", desc: "On orders over $150"
  },
  {
    icon: <RefreshCw className="h-6 w-6" />, label: "Easy Returns", desc: "30-day hassle-free returns"
  },
  {
    icon: <Clock className="h-6 w-6" />, label: "Limited Time", desc: "While supplies last"
  }
];

const priceRanges = [
  { label: "Under $25", min: 0, max: 25 },
  { label: "$25 - $50", min: 25, max: 50 },
  { label: "$50 - $100", min: 50, max: 100 },
  { label: "$100 - $200", min: 100, max: 200 },
  { label: "$200+", min: 200, max: null },
];

const CollectionsPage = () => {
  // Fetch flash deals (products with flash_deal=true and not expired)
  const { data, isLoading, error } = useQuery({
    queryKey: ['flash-deals'],
    queryFn: () => fetchProducts({ flash_deal: true, limit: 8 }),
    select: (res) => res?.data?.filter(
      p => p.flash_deal && (!p.flash_deal_end || new Date(p.flash_deal_end) > new Date())
    ) || [],
    staleTime: 1000 * 60 * 5,
  });

  // Find soonest-ending deal for countdown
  const soonestEnd = useMemo(() => {
    if (!data?.length) return null;
    return data.reduce((min, p) => {
      if (!p.flash_deal_end) return min;
      const end = new Date(p.flash_deal_end);
      return (!min || end < min) ? end : min;
    }, null);
  }, [data]);

  // Countdown timer state
  const [timer, setTimer] = useState('');
  useEffect(() => {
    if (!soonestEnd) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = soonestEnd - now;
      if (diff <= 0) {
        setTimer('00:00:00');
        clearInterval(interval);
        return;
      }
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setTimer(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [soonestEnd]);

  const [selectedPrice, setSelectedPrice] = useState(null);

  const {
    data: filteredProducts,
    isLoading: filteredLoading,
    error: filteredError,
  } = useQuery({
    queryKey: [
      'shop-by-price',
      selectedPrice?.min,
      selectedPrice?.max,
    ],
    queryFn: () => fetchProducts({
      ...(selectedPrice ? {
        ...(selectedPrice.min !== null ? { price_gte: selectedPrice.min } : {}),
        ...(selectedPrice.max !== null ? { price_lte: selectedPrice.max } : {}),
      } : {}),
      limit: 8,
    }),
    enabled: !!selectedPrice,
    select: (res) => res?.data || [],
    staleTime: 1000 * 60 * 5,
  });

  // Fetch public collections
  const {
    data: publicCollections,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useQuery({
    queryKey: ['public-collections'],
    queryFn: fetchPublicCollections,
    select: (data) => data || [],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch New Arrivals
  const {
    data: newArrivals,
    isLoading: newArrivalsLoading,
    error: newArrivalsError,
  } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: () => fetchProducts({ is_new_arrival: true, limit: 4 }), // Changed sortBy and order to is_new_arrival: true
    select: (res) => res?.data || [],
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // Trending Products Section
  // const TrendingProducts = () => {
  //   const { data, isLoading, error } = useQuery({
  //     queryKey: ['trending-products'],
  //     queryFn: () => fetchProducts({ is_trending: true, limit: 8 }),
  //     select: (res) => res?.data || [],
  //     staleTime: 1000 * 60 * 5,
  //   });
  //   return (
  //     <section className="container mx-auto px-4 sm:px-6 mb-20">
  //       <div className="mb-10 text-center">
  //         <h2 className="text-3xl font-light mb-2 tracking-tight">Trending Now</h2>
  //         <p className="text-neutral-500 text-sm max-w-md mx-auto">See what's hot and in demand right now.</p>
  //       </div>
  //       {isLoading ? (
  //         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
  //           {Array.from({ length: 4 }).map((_, i) => (
  //             <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse">
  //               <div className="aspect-square bg-neutral-200 rounded mb-4"></div>
  //               <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2 mx-auto"></div>
  //               <div className="h-6 bg-neutral-200 rounded w-1/4 mx-auto"></div>
  //             </div>
  //           ))}
  //         </div>
  //       ) : error ? (
  //         <div className="text-center text-red-500 py-10">Could not load trending products. Please try again later.</div>
  //       ) : data && data.length > 0 ? (
  //         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
  //           {data.map(product => (
  //             <div key={product.id} className="group">
  //               <ProductCard product={product} className="transition-shadow duration-300 group-hover:shadow-xl" />
  //             </div>
  //           ))}
  //         </div>
  //       ) : (
  //         <div className="text-center text-neutral-500 py-10">No trending products found.</div>
  //       )}
  //     </section>
  //   );
  // };

  // Featured Products Section
  const FeaturedProducts = () => {
    const { data, isLoading, error } = useQuery({
      queryKey: ['featured-products'],
      queryFn: () => fetchProducts({ is_featured: true, limit: 8 }),
      select: (res) => res?.data || [],
      staleTime: 1000 * 60 * 5,
    });
    return (
      <section className="container mx-auto px-4 sm:px-6 mb-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-light mb-2 tracking-tight">Featured Products</h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">Handpicked favorites from our collection.</p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse">
                <div className="aspect-square bg-neutral-200 rounded mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2 mx-auto"></div>
                <div className="h-6 bg-neutral-200 rounded w-1/4 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">Could not load featured products. Please try again later.</div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {data.map(product => (
              <div key={product.id} className="group">
                <ProductCard product={product} className="transition-shadow duration-300 group-hover:shadow-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-neutral-500 py-10">No featured products found.</div>
        )}
      </section>
    );
  };

  return (
    <div className="bg-white min-h-screen text-neutral-900">
      <Helmet>
        <title>Collections | SuriAddis</title>
        <meta name="description" content="Browse curated collections of premium products on SuriAddis." />
      </Helmet>
      <section className="container mx-auto px-4 sm:px-6 pt-32 pb-16">
        <div className="max-w-2xl mb-12">
          <div className="inline-block px-3 py-1 mb-6 border border-neutral-200 text-xs uppercase tracking-widest text-neutral-500 bg-white">
            Curated Collections
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extralight mb-6 leading-tight tracking-tight">
            Discover <span className="font-medium">Artisan</span> Style
          </h1>
          <p className="text-lg text-neutral-600 mb-10 font-light max-w-lg">
            Explore our signature collections, crafted for those who value timeless design and modern luxury.
          </p>
          <div className="flex flex-wrap gap-6 mb-10">
            {featureIcons.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full border border-neutral-200 flex items-center justify-center bg-white">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">{f.label}</p>
                  <p className="text-xs text-neutral-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((col) => (
            <div key={col.id} className="relative group rounded-2xl overflow-hidden shadow-lg border border-neutral-100 bg-white">
              <div className="aspect-[3/4] relative overflow-hidden">
                <img
                  src={col.image}
                  alt={col.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  onError={e => { 
                    if (e.target.src !== SUPABASE_PLACEHOLDER_IMAGE_URL) {
                      e.target.onerror = null; e.target.src = SUPABASE_PLACEHOLDER_IMAGE_URL; 
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-end p-6">
                  <div>
                    <span className="inline-block mb-2 px-3 py-1 bg-neutral-100 text-xs uppercase tracking-widest rounded-full text-neutral-500">
                      {col.highlight}
                    </span>
                    <h2 className="text-2xl font-semibold mb-2 drop-shadow text-white">{col.name}</h2>
                    <p className="text-sm text-neutral-200 mb-4 max-w-xs drop-shadow">{col.description}</p>
                    <Link
                      to={col.url}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full font-medium shadow hover:bg-neutral-100 transition-all text-base"
                    >
                      {col.cta}
                    </Link>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 text-black text-xs font-semibold px-4 py-1 rounded-full shadow border border-neutral-200">
                  {col.badge}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seller Collections Section */}
      {publicCollections && publicCollections.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 mb-20">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-light mb-2 tracking-tight">Seller Collections</h2>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">
              Discover curated collections from our talented sellers
            </p>
          </div>
          
          {collectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-neutral-200 rounded-2xl p-4 animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-neutral-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : collectionsError ? (
            <div className="text-center text-red-500 py-10">
              Could not load seller collections. Please try again later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publicCollections.map((collection) => (
                <div key={collection.id} className="relative group rounded-2xl overflow-hidden shadow-lg border border-neutral-100 bg-white">
                  <div className="aspect-[3/4] relative overflow-hidden">
                    <img
                      src={collection.image_url || SUPABASE_PLACEHOLDER_IMAGE_URL}
                      alt={collection.name}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                      onError={e => { 
                        if (e.target.src !== SUPABASE_PLACEHOLDER_IMAGE_URL) {
                          e.target.onerror = null; 
                          e.target.src = SUPABASE_PLACEHOLDER_IMAGE_URL; 
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-end p-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <Store className="h-4 w-4 text-white mr-2" />
                          <span className="text-xs text-neutral-200">
                            {collection.seller_name || 'Curated Collection'}
                          </span>
                        </div>
                        <h3 className="text-2xl font-semibold mb-2 drop-shadow text-white">
                          {collection.name}
                        </h3>
                        <p className="text-sm text-neutral-200 mb-4 max-w-xs drop-shadow">
                          {collection.description}
                        </p>
                        <Link
                          to={`/collections/${collection.id}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full font-medium shadow hover:bg-neutral-100 transition-all text-base"
                        >
                          View Collection
                        </Link>
                      </div>
                    </div>
                    {collection.price && (
                      <div className="absolute top-4 right-4 bg-white/90 text-black text-xs font-semibold px-4 py-1 rounded-full shadow border border-neutral-200">
                        ${collection.price}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Call to Action for Sellers */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 text-neutral-600 text-sm mb-4">
              <Store className="h-4 w-4" />
              <span>Are you a seller?</span>
            </div>
            <Link
              to="/seller/apply"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Store className="h-4 w-4" />
              Become a Seller
            </Link>
          </div>
        </section>
      )}

      {/* Bold Fashionistic Ad Banner - Added bottom margin */}
      <section className="container mx-auto px-4 sm:px-6 mb-24"> {/* Increased bottom margin */}
        <div className="relative flex flex-col md:flex-row items-stretch rounded-none overflow-hidden border-y border-black bg-white shadow-none">
          {/* Left: High-Fashion Image Placeholder */}
          <div className="flex-1 md:w-1/2 relative min-h-[400px] md:min-h-[500px] bg-neutral-100 border-r border-black">
            <img
              src={SUPABASE_SIGNATURE_IMAGE_URL} 
              alt="Fashion Forward Collection"
              className="absolute inset-0 w-full h-full object-cover object-center grayscale filter"
              onError={e => { 
                if (e.target.src !== SUPABASE_PLACEHOLDER_IMAGE_URL) { // Fallback to general placeholder on error
                  e.target.onerror = null; e.target.src = SUPABASE_PLACEHOLDER_IMAGE_URL; 
                }
              }}
            />
            <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
          </div>
          {/* Content */}
          <div className="flex-1 md:w-1/2 flex flex-col justify-center items-start px-8 py-16 md:py-24 md:pl-16 bg-white">
            <span className="block mb-4 text-sm font-bold tracking-[0.2em] text-black uppercase">LIMITED EDITION</span>
            <h2 className="text-5xl sm:text-7xl font-black mb-6 tracking-tighter text-black leading-none font-sans">
              FUTURE<br />CLASSICS
            </h2>
            <p className="text-lg sm:text-xl text-black mb-10 max-w-md font-normal">
              Define tomorrow's style. Explore avant-garde designs and statement pieces that challenge convention. Exclusivity is the new luxury.
            </p>
            <Link to="/collections/signature" className="inline-block px-12 py-4 rounded-none bg-transparent text-black font-bold text-base tracking-wider border-2 border-black hover:bg-black hover:text-white transition-all shadow-none uppercase">
              Explore Now
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals Section - Mobile-First Grid */}
      <section className="container mx-auto px-4 sm:px-6 mb-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-light mb-2 tracking-tight">Fresh Off the Press</h2>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">Explore the latest styles landing in our collection.</p>
        </div>
        {newArrivalsLoading ? (
          // Loading state: Match HomePage grid (2 cols base)
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse">
                <div className="aspect-square bg-neutral-200 rounded mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2 mx-auto"></div>
                <div className="h-6 bg-neutral-200 rounded w-1/4 mx-auto"></div>
              </div>
            ))}
          </div>
        ) : newArrivalsError ? (
          <div className="text-center text-red-500 py-10">Could not load new arrivals. Please try again later.</div>
        ) : newArrivals && newArrivals.length > 0 ? (
          // Match HomePage grid: 2 cols base, 3 sm, 4 lg - with smaller gap
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {newArrivals.map(product => (
              <div key={product.id} className="group">
                <ProductCard product={product} className="transition-shadow duration-300 group-hover:shadow-xl" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-neutral-500 py-10">No new arrivals found. Check back soon!</div>
        )}
      </section>

      {/* Typographic & Geometric Black/White Ad Banner */}
      <section className="container mx-auto px-4 sm:px-6 mb-20">
        <div className="relative flex flex-col md:flex-row items-stretch rounded-none overflow-hidden border border-black bg-white">
          {/* Left: Geometric Pattern */}
          <div className="hidden md:flex flex-col justify-center items-center w-1/3 bg-black p-12 relative border-r border-black">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="bwdots" patternUnits="userSpaceOnUse" width="10" height="10">
                  <circle cx="5" cy="5" r="1" fill="white" />
                </pattern>
                <pattern id="bwlines" patternUnits="userSpaceOnUse" width="10" height="10">
                  <path d="M0 0 L10 10 M10 0 L0 10" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="50%" height="100%" fill="url(#bwdots)" />
              <rect x="50%" width="50%" height="100%" fill="url(#bwlines)" />
            </svg>
          </div>
          {/* Content */}
          <div className="flex-1 flex flex-col justify-center items-start px-8 py-16 md:py-24 md:pl-16 bg-white">
            <span className="block mb-4 text-sm font-bold tracking-[0.2em] text-black uppercase">ESSENTIALS REIMAGINED</span>
            <h2 className="text-5xl sm:text-6xl font-black mb-6 tracking-tighter text-black leading-none font-sans">
              FORM &<br />FUNCTION
            </h2>
            <p className="text-lg sm:text-xl text-black mb-10 max-w-md font-normal">
              Where minimalist design meets maximum impact. Explore core pieces built for longevity and effortless style.
            </p>
            <Link
              to="/collections/minimalist"
              className="inline-block px-12 py-4 rounded-none bg-black text-white font-bold text-base tracking-wider border-2 border-black hover:bg-white hover:text-black transition-all shadow-none uppercase"
            >
              Shop Minimalist
            </Link>
          </div>
        </div>
      </section>

      {/* Flash Deals / Limited Time Offers */}
      {!isLoading && data && data.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 mb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-light mb-2">Flash Deals</h2>
              <p className="text-neutral-500 text-sm">Limited time offers on top picks. Grab them before they're gone!</p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 px-4 py-2 rounded-full shadow">
              <span>Ends in</span>
              <span id="flash-deal-timer" className="font-mono">{timer || '--:--:--'}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.map(product => (
              <ProductCard key={product.id} product={product} featured />
            ))}
          </div>
        </section>
      )}

      {/* Trending Products Section */}
      {/* <TrendingProducts /> */}

      {/* Featured Products Section */}
      <FeaturedProducts />

      {/* Newsletter Section - Styled like HomePage */}
      <section className="py-16 sm:py-24 bg-neutral-100"> {/* Updated padding */}
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl text-center"> {/* Updated max-width */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light mb-4 tracking-tight">Join Our Community</h2> {/* Added md:text-4xl */}
          <p className="text-neutral-600 mb-8 max-w-xl mx-auto text-sm sm:text-base">
            Subscribe for exclusive updates, early access to new collections, and personalized recommendations.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            {/* Use Input component */}
            <Input 
              type="email" 
              placeholder="Your email address" 
              className="h-12 border-neutral-300 bg-transparent flex-1" // Applied HomePage styles
              required 
            />
            {/* Use Button component */}
            <Button 
              type="submit" 
              className="h-12 px-6 bg-black text-white hover:bg-black/90 font-light" // Applied HomePage styles
            >
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-neutral-500 mt-4">
            By subscribing, you agree to our Privacy Policy and consent to receive updates from our company.
          </p>
        </div>
      </section>
    </div>
  );
};

export default CollectionsPage;
