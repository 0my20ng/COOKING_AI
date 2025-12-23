'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import IngredientInput from '@/components/IngredientInput';
import DishInput from '@/components/DishInput';
import RecommendationList from '@/components/RecommendationList';
import { useIngredientStore } from '@/store/useIngredientStore';
import { useRouter } from 'next/navigation';
import { Search, Zap, Telescope, ChefHat, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Recommendation {
  name: string;
  reason: string;
  difficulty: string;
  time: string;
}

export default function Home() {
  const router = useRouter();
  const { ingredients, searchMode, setSearchMode, setTargetDish } = useIngredientStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  const handleSearch = () => {
    if (ingredients.length === 0) {
      alert('재료를 하나 이상 입력해주세요!');
      return;
    }
    router.push('/search');
  };

  const handleRecommend = async () => {
    if (ingredients.length === 0) {
      alert('재료를 먼저 입력해주세요!');
      return;
    }

    setIsRecommending(true);
    setRecommendations([]);

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Recommendation failed', error);
      alert('요리 추천 중 오류가 발생했습니다.');
    } finally {
      setIsRecommending(false);
    }
  };

  const handleSelectRecommendation = (dishName: string) => {
    setTargetDish(dishName);
    router.push('/search');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <Header />

        <main className="mt-8 flex flex-col items-center">
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <IngredientInput />
            <DishInput />

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setSearchMode('fast')}
                className={`flex items-center px-6 py-3 rounded-full border-2 transition-all duration-200 transform hover:scale-105 ${searchMode === 'fast'
                  ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-500'
                  }`}
              >
                <Zap className={`w-5 h-5 mr-2 ${searchMode === 'fast' ? 'fill-white stroke-white' : 'fill-none'}`} />
                <span className="font-bold">빠르게 (추론)</span>
              </button>
              <button
                onClick={() => setSearchMode('detailed')}
                className={`flex items-center px-6 py-3 rounded-full border-2 transition-all duration-200 transform hover:scale-105 ${searchMode === 'detailed'
                  ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-purple-300 hover:text-purple-600'
                  }`}
              >
                <Telescope className={`w-5 h-5 mr-2 ${searchMode === 'detailed' ? 'fill-white stroke-white' : 'fill-none'}`} />
                <span className="font-bold">세세하게 (분석)</span>
              </button>
            </div>

            <div className="pt-8 text-center space-y-4">
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleSearch}
                  disabled={ingredients.length === 0}
                  className={`
                    group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200
                    bg-orange-500 rounded-full hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                    disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-200 min-w-[200px]
                  `}
                >
                  <Search className="mr-2 -ml-1 w-5 h-5 group-hover:scale-110 transition-transform" />
                  레시피 찾기
                </button>

                <button
                  onClick={handleRecommend}
                  disabled={ingredients.length === 0 || isRecommending}
                  className={`
                    group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-orange-600 transition-all duration-200
                    bg-white border-2 border-orange-100 rounded-full hover:border-orange-300 hover:bg-orange-50
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                    disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-[200px]
                  `}
                >
                  {isRecommending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <ChefHat className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  )}
                  {isRecommending ? '생각중...' : '요리 추천받기'}
                </button>
              </div>
            </div>

            <RecommendationList
              recommendations={recommendations}
              onSelect={handleSelectRecommendation}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
