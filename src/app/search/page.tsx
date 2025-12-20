'use client';

import React, { useEffect, useState } from 'react';
import { useIngredientStore } from '@/store/useIngredientStore';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Zap, Telescope, AlertTriangle } from 'lucide-react';
import axios from 'axios';

interface SearchResult {
    title: string;
    snippet: string;
    link: string;
    source: string;
    thumbnail?: string;
    missingIngredients?: string[];
    analyzed?: boolean;
}

export default function SearchPage() {
    const { ingredients, targetDish, searchMode } = useIngredientStore();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [recommendedMenus, setRecommendedMenus] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.post('/api/search', {
                    ingredients,
                    dish: targetDish,
                    mode: searchMode
                });
                setResults(response.data.results || []);
                setRecommendedMenus(response.data.recommendedMenus || []);
            } catch (err) {
                console.error(err);
                setError('레시피를 불러오는 중 오류가 발생했습니다 😢 잠시 후 다시 시도해주세요.');
            } finally {
                setLoading(false);
            }
        };

        if (ingredients.length > 0) {
            fetchResults();
        }
    }, [ingredients, targetDish, searchMode]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mb-6"></div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {searchMode === 'fast' ? '빠르게 레시피를 찾고 있어요! ⚡' : '블로그를 꼼꼼히 분석하고 있어요! 🕵️'}
                </h2>
                <p className="text-gray-500 font-medium animate-pulse max-w-sm">
                    {searchMode === 'detailed'
                        ? '시간이 조금 걸릴 수 있습니다 (약 10~20초). AI가 재료를 하나하나 대조해보고 있어요.'
                        : 'AI가 최적의 검색어와 부족한 재료를 추론 중입니다.'}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 flex items-center">
                                검색 결과
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium border ${searchMode === 'fast' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                                    }`}>
                                    {searchMode === 'fast' ? '⚡ 빠른 검색' : '🕵️ 정밀 분석'}
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500 truncate max-w-[200px] md:max-w-md">
                                재료: {ingredients.join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {error ? (
                    <div className="text-center py-20 text-gray-500">
                        <div className="inline-block p-4 bg-red-50 text-red-500 rounded-full mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <p>{error}</p>
                        <Link href="/" className="text-orange-500 hover:underline mt-4 inline-block">다시 검색하기</Link>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col space-y-4">
                            {/* AI Menu Recommendations */}
                            {recommendedMenus.length > 0 && (
                                <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-5 rounded-2xl border border-orange-200">
                                    <h3 className="text-orange-900 font-bold flex items-center mb-3">
                                        <span className="text-xl mr-2">👨‍🍳</span>
                                        AI 셰프의 추천 메뉴
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {recommendedMenus.map((menu, idx) => (
                                            <div key={idx} className="bg-white text-orange-800 px-4 py-2 rounded-full font-bold shadow-sm border border-orange-100 flex items-center">
                                                {menu}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="text-sm text-gray-500 flex justify-between items-center px-1">
                                <span>총 {results.length}개의 추천 레시피</span>
                            </div>
                        </div>

                        {results.map((result, index) => (
                            <a
                                key={index}
                                href={result.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative"
                            >
                                <div className="flex flex-col md:flex-row">
                                    {result.thumbnail && (
                                        <div className="w-full h-48 md:w-48 md:h-auto bg-gray-200 flex-shrink-0 relative overflow-hidden">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={result.thumbnail}
                                                alt={result.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    )}
                                    <div className="flex-1 p-5 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                                    {result.source || 'WEB'}
                                                </span>
                                                <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors leading-tight">
                                                {result.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2 md:line-clamp-2 mb-4">
                                                {result.snippet}
                                            </p>
                                        </div>

                                        {result.missingIngredients && result.missingIngredients.length > 0 ? (
                                            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm">
                                                <strong className="text-orange-800 flex items-center mb-1">
                                                    💡 부족한 재료 {searchMode === 'detailed' && '(본문 확인됨)'}
                                                </strong>
                                                <div className="flex flex-wrap gap-1">
                                                    {result.missingIngredients.map((item, i) => (
                                                        <span key={i} className="text-gray-700 bg-white border border-gray-200 px-2 py-0.5 rounded text-xs">
                                                            + {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-700 font-medium">
                                                ✨ 추가 재료 없이 가능할 것 같아요! (추정)
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </a>
                        ))}

                        {results.length === 0 && !loading && (
                            <div className="text-center py-20 text-gray-500">
                                적절한 레시피를 찾지 못했습니다 😢
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
