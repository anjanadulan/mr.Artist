import { createClient } from '@supabase/supabase-js';

// Read Supabase credentials from Vite environment variables (.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client instance if credentials exist
export const supabase = (supabaseUrl && supabaseAnonKey) 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

// Default fallback catalog if Supabase is not connected or empty
export const defaultArtworks = [
    {
        id: 'art1',
        name: 'Sahara Sunset Horizon',
        src: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=85',
        category: 'landscape',
        format: '12.5 x 18" x3 Triptych (4mm 2600GSM)',
        price: 'LKR 2,900',
        rawPrice: 2900,
        tag: '4mm Rigid Triptych Set',
        desc: 'Continuous panoramic landscape across three 12.5x18 inch rigid 4mm (2600GSM) boards.'
    },
    {
        id: 'art2',
        name: 'Golden Coast Panoramic',
        src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85',
        category: 'landscape',
        format: '12.5 x 24.5" Landscape (4mm 2600GSM)',
        price: 'LKR 2,400',
        rawPrice: 2400,
        tag: '4mm Rigid Landscape Board',
        desc: 'Expansive 12.5 x 24.5 inch horizontal display mounted on heavy 4mm (2600GSM) rigid board.'
    },
    {
        id: 'art3',
        name: 'Terracotta Abstract Geometry',
        src: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=85',
        category: 'abstract',
        format: 'A3 Size (300GSM Board)',
        price: 'LKR 900',
        rawPrice: 900,
        tag: 'A3 300GSM Board',
        desc: 'Expressive modern texture on 300GSM fine art board. Calibrated for warm neutral interiors.'
    },
    {
        id: 'art4',
        name: 'Botanical Silhouette Study',
        src: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=85',
        category: 'botanical',
        format: 'A4 Size (300GSM Board)',
        price: 'LKR 500',
        rawPrice: 500,
        tag: 'A4 300GSM Board',
        desc: 'Delicate foliage and warm earthy background tones printed on 300GSM premium art board.'
    },
    {
        id: 'art5',
        name: 'Nordic Pine Valley',
        src: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1000&q=85',
        category: 'landscape',
        format: '12.5 x 24.5" Landscape (4mm 2600GSM)',
        price: 'LKR 2,400',
        rawPrice: 2400,
        tag: '4mm Rigid Landscape Board',
        desc: 'Calm evergreen wilderness with soft atmospheric mist on 4mm heavy rigid board.'
    },
    {
        id: 'art6',
        name: 'Minimalist Ceramic Form',
        src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=85',
        category: 'abstract',
        format: 'A4 Size (300GSM Board)',
        price: 'LKR 500',
        rawPrice: 500,
        tag: 'A4 300GSM Board',
        desc: 'Handcrafted pottery shapes and gentle lighting on 300GSM fine art board.'
    }
];

// Fetch Artworks from Supabase Database (or fallback)
export async function fetchArtworks() {
    if (!supabase) {
        console.info("⚡ Supabase not yet configured in .env. Using fallback catalog.");
        return defaultArtworks;
    }

    try {
        const { data, error } = await supabase
            .from('artworks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Error fetching from Supabase 'artworks' table:", error.message);
            return defaultArtworks;
        }

        if (data && data.length > 0) {
            return data.map(item => ({
                id: item.id?.toString() || item.name,
                name: item.name || 'Untitled Artwork',
                src: item.image_url || item.src || '',
                category: (item.category || 'landscape').toLowerCase(),
                format: item.format || 'Art Board',
                price: typeof item.price === 'number' ? `LKR ${item.price.toLocaleString()}` : (item.price || 'LKR 500'),
                rawPrice: typeof item.price === 'number' ? item.price : 500,
                tag: item.tag || 'Fine Art Board',
                desc: item.description || item.desc || ''
            }));
        }

        return defaultArtworks;
    } catch (err) {
        console.warn("Supabase fetch failed, using fallback:", err);
        return defaultArtworks;
    }
}

// Default fallback samples for printed showcase
export const defaultSamples = [
    {
        id: 'sample1',
        name: 'Alpine Panorama 3-Panel Set',
        src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=85',
        size: '12.5 x 18" x3 Triptych (4mm Board)',
        price: 'LKR 2,900',
        rawPrice: 2900
    },
    {
        id: 'sample2',
        name: 'Mist & Valley Horizontal',
        src: 'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1200&q=85',
        size: '12.5 x 24.5" Landscape (4mm Board)',
        price: 'LKR 2,400',
        rawPrice: 2400
    },
    {
        id: 'sample3',
        name: 'Earthy Minimalist Texture',
        src: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=85',
        size: 'A3 Size (300GSM Board)',
        price: 'LKR 900',
        rawPrice: 900
    },
    {
        id: 'sample4',
        name: 'Golden Botanical Leaves',
        src: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=85',
        size: 'A4 Size (300GSM Board)',
        price: 'LKR 500',
        rawPrice: 500
    }
];

// Fetch Samples from Supabase Database
export async function fetchSamples() {
    if (!supabase) {
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('samples')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.warn("Error fetching from Supabase 'samples' table:", error.message);
            return [];
        }

        if (data) {
            return data.map(item => ({
                id: item.id,
                name: item.name,
                src: item.image_url,
                size: item.size || 'Fine Art Board',
                price: `LKR ${(item.price || 500).toLocaleString()}`,
                rawPrice: item.price || 500
            }));
        }

        return [];
    } catch (err) {
        console.warn("Supabase samples fetch failed:", err);
        return [];
    }
}
