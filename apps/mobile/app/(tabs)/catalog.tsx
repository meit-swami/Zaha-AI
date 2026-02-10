import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native';
import { Link, useRouter } from 'expo-router';

const PRODUCTS = [
    // Sarees
    {
        id: '1',
        name: "Ocean Breeze Silk Saree",
        price: "₹37,500",
        category: "Sarees",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop",
        type: "apparel"
    },
    {
        id: '2',
        name: "Royal Banarasi Saree",
        price: "₹85,000",
        category: "Sarees",
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop",
        type: "apparel"
    },
    {
        id: '3',
        name: "Kanjivaram Heritage Saree",
        price: "₹1,25,000",
        category: "Sarees",
        image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?q=80&w=600&auto=format&fit=crop",
        type: "apparel"
    },

    // Lehengas
    {
        id: '4',
        name: "Royal Velvet Lehenga",
        price: "₹74,150",
        category: "Lehengas",
        image: "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=600&auto=format&fit=crop",
        type: "apparel"
    },
    {
        id: '5',
        name: "Bridal Red Lehenga",
        price: "₹2,50,000",
        category: "Lehengas",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
        type: "apparel"
    },
    {
        id: '6',
        name: "Pastel Dream Lehenga",
        price: "₹1,45,000",
        category: "Lehengas",
        image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=600&auto=format&fit=crop",
        type: "apparel"
    },

    // Jewellery
    {
        id: '7',
        name: "Emerald Oasis Set",
        price: "₹1,08,250",
        category: "Jewellery",
        image: "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=600&auto=format&fit=crop",
        type: "jewelry"
    },
    {
        id: '8',
        name: "Diamond Solitaire Pendant",
        price: "₹2,00,000",
        category: "Jewellery",
        image: "https://images.unsplash.com/photo-1515562141207-7a88fb0537bf?q=80&w=600&auto=format&fit=crop",
        type: "jewelry"
    },
    {
        id: '9',
        name: "Gold Temple Necklace",
        price: "₹3,50,000",
        category: "Jewellery",
        image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=600&auto=format&fit=crop",
        type: "jewelry"
    },

    // Men's Shirts
    {
        id: '10',
        name: "Premium Linen Shirt",
        price: "₹4,500",
        category: "Men's Wear",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=600&auto=format&fit=crop",
        type: "apparel"
    },
    {
        id: '11',
        name: "Formal White Shirt",
        price: "₹3,200",
        category: "Men's Wear",
        image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop",
        type: "apparel"
    },

    // Men's Pants
    {
        id: '12',
        name: "Tailored Chinos",
        price: "₹5,500",
        category: "Men's Wear",
        image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=600&auto=format&fit=crop",
        type: "apparel"
    },

    // Watches
    {
        id: '13',
        name: "Luxury Chronograph Watch",
        price: "₹1,85,000",
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=600&auto=format&fit=crop",
        type: "jewelry"
    },
    {
        id: '14',
        name: "Classic Leather Watch",
        price: "₹45,000",
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=600&auto=format&fit=crop",
        type: "jewelry"
    },

    // Eyewear
    {
        id: '15',
        name: "Aviator Sunglasses",
        price: "₹12,500",
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=600&auto=format&fit=crop",
        type: "jewelry"
    },
    {
        id: '16',
        name: "Designer Optical Frames",
        price: "₹18,000",
        category: "Accessories",
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600&auto=format&fit=crop",
        type: "jewelry"
    }
];

type Product = typeof PRODUCTS[0];

export default function CatalogScreen() {
    const router = useRouter();

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>{item.price}</Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push({
                        pathname: "/try-on",
                        params: {
                            type: item.type,
                            image: item.image
                        }
                    })}
                >
                    <Text style={styles.buttonText}>VIRTUAL TRY-ON</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>New Arrivals</Text>
            <FlatList
                data={PRODUCTS}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        paddingTop: 60,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#004D40',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: 300,
    },
    info: {
        padding: 20,
    },
    category: {
        color: '#C5A065',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    price: {
        fontSize: 18,
        color: '#4B5563',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#006D66',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});
