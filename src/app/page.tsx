
"use client";

import Link from "next/link";
import { MoveRight, Loader2, Maximize, UserCheck, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";

export default function Home() {
    const [isAdminHover, setIsAdminHover] = useState(false);

    return (
        <main className="min-h-screen bg-gradient-to-br from-prime-dark via-prime to-prime-light text-white overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-prime-light/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            {/* Navigation */}
            <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center glass-morphism rounded-b-2xl mb-12">
                <h1 className="font-serif text-3xl font-bold tracking-wider text-accent drop-shadow-lg">
                    ZAHA AI <span className="text-white text-xs block font-sans tracking-widest font-light opacity-80">BY BRANDZAHA CREATIVE AGENCY</span>
                </h1>
                <div className="hidden md:flex space-x-8 font-sans text-sm font-medium tracking-wide">
                    <Link href="#features" className="hover:text-accent transition-colors">FEATURES</Link>
                    <Link href="#pricing" className="hover:text-accent transition-colors">PRICING</Link>
                    <Link href="/admin/login" className="hover:text-accent transition-colors font-semibold text-accent/80">ADMIN LOGIN</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 container mx-auto px-6 flex flex-col md:flex-row items-center justify-between min-h-[60vh]">
                <div className="md:w-1/2 space-y-8 animate-slide-up">
                    <div className="inline-flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
                        <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                        <span className="text-xs uppercase tracking-widest font-semibold text-accent-light">Enterprise Version 2.0 Live</span>
                    </div>
                    <h2 className="font-serif text-5xl md:text-7xl font-bold leading-tight">
                        The Future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-white">Digital Couture</span>
                    </h2>
                    <p className="font-sans text-lg text-gray-200 max-w-lg leading-relaxed border-l-2 border-accent pl-6">
                        Transform your retail space with AI-powered virtual try-ons. No hardware required. Stunning accuracy. Instant conversions.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link
                            href="/store-demo"
                            className="group relative px-8 py-4 bg-accent hover:bg-white text-prime-dark font-bold font-sans tracking-wide rounded-full overflow-hidden transition-all duration-300 shadow-lg shadow-accent/20 flex items-center justify-center space-x-2"
                        >
                            <span className="relative z-10 flex items-center gap-2">LAUNCH DEMO STORE <MoveRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
                        </Link>

                        <Link
                            href="/onboarding"
                            className="group px-8 py-4 border border-white/30 hover:border-accent text-white hover:text-accent font-medium font-sans tracking-wide rounded-full transition-all flex items-center justify-center"
                        >
                            Partner With Us
                        </Link>
                    </div>

                    <div className="pt-4 flex justify-center md:justify-start">
                        <Link
                            href="/ar-mirror?type=jewelry"
                            className="text-xs uppercase tracking-widest text-accent hover:text-white border-b border-accent/50 pb-1 transition-colors"
                        >
                            ⚡ Test AR Core Directly (Mobile Web)
                        </Link>
                    </div>
                </div>

                {/* Hero Visual */}
                <div className="md:w-1/2 mt-12 md:mt-0 relative h-[500px] w-full flex items-center justify-center">
                    {/* Simulation of AR Frame */}
                    <div className="relative w-[320px] h-[580px] bg-dark rounded-[40px] border-4 border-white/10 shadow-2xl overflow-hidden glass-morphism p-2 rotate-[-5deg] hover:rotate-0 transition-all duration-500 hover:scale-105">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-black rounded-b-xl z-20"></div>

                        {/* Screen Content Mockup */}
                        <div className="w-full h-full bg-gray-900 rounded-[32px] overflow-hidden relative">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-80" />

                            {/* UI Overlay */}
                            <div className="absolute inset-0 flex flex-col justify-between p-6 bg-gradient-to-b from-transparent to-black/80">
                                <div className="flex justify-between items-start pt-8">
                                    <div className="bg-black/40 backdrop-blur rounded p-2 text-xs text-white">98% Match</div>
                                    <Maximize className="text-white w-5 h-5" />
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h4 className="text-white font-serif text-xl font-bold">Zaha Silk Saree</h4>
                                        <p className="text-accent text-sm">₹24,900</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-white text-black py-3 rounded-full font-bold text-sm">Add to Bag</button>
                                        <button className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white">
                                            <ShieldCheck className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="container mx-auto px-6 py-24 z-10 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: UserCheck, title: "Face & Body AI", desc: "Enterprise-grade MediaPipe integration for accurate landmark detection." },
                        { icon: Zap, title: "Real-Time Rendering", desc: "No server lag. Pure client-side GPU acceleration for instant feedback." },
                        { icon: ShieldCheck, title: "Privacy First", desc: "We process everything on-device. No images stored without explicit consent." }
                    ].map((f, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors group cursor-pointer">
                            <f.icon className="w-10 h-10 text-accent mb-4 group-hover:scale-110 transition-transform" />
                            <h3 className="font-serif text-xl font-bold text-white mb-2">{f.title}</h3>
                            <p className="text-gray-300 font-sans text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
