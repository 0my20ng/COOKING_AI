'use client';

import React from 'react';
import { useIngredientStore } from '@/store/useIngredientStore';

const DishInput = () => {
    const { targetDish, setTargetDish } = useIngredientStore();

    return (
        <div className="w-full max-w-xl mx-auto mt-8">
            <label htmlFor="dish-input" className="block text-sm font-medium text-gray-700 mb-2">
                만들고 싶은 요리 (선택사항)
            </label>
            <input
                id="dish-input"
                type="text"
                className="w-full px-6 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder-gray-400 bg-white"
                placeholder="예: 김치찌개, 파스타"
                value={targetDish}
                onChange={(e) => setTargetDish(e.target.value)}
            />
        </div>
    );
};

export default DishInput;
