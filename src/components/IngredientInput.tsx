'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { useIngredientStore } from '@/store/useIngredientStore';

const IngredientInput = () => {
    const [inputValue, setInputValue] = useState('');
    const { ingredients, addIngredient, removeIngredient } = useIngredientStore();

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (inputValue.trim()) {
                addIngredient(inputValue);
                setInputValue('');
            }
        }
    };

    const handleAddClick = () => {
        if (inputValue.trim()) {
            addIngredient(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto space-y-4">
            <div className="relative">
                <label htmlFor="ingredient-input" className="block text-sm font-medium text-gray-700 mb-2">
                    재료 입력
                </label>
                <div className="flex shadow-sm rounded-full overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent transition-all">
                    <input
                        id="ingredient-input"
                        type="text"
                        className="flex-1 px-6 py-3 outline-none text-gray-900 bg-white placeholder-gray-400"
                        placeholder="예: 양파, 계란, 스팸 (엔터로 추가)"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                    />
                    <button
                        onClick={handleAddClick}
                        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors flex items-center justify-center"
                        aria-label="재료 추가"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[3rem] p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                {ingredients.length === 0 ? (
                    <div className="w-full text-center text-gray-400 text-sm py-2">
                        냉장고에 있는 재료를 추가해주세요!
                    </div>
                ) : (
                    ingredients.map((ingredient, index) => (
                        <span
                            key={`${ingredient}-${index}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800 animate-in fade-in zoom-in duration-200"
                        >
                            {ingredient}
                            <button
                                type="button"
                                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-orange-200 text-orange-600 focus:outline-none"
                                onClick={() => removeIngredient(index)}
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))
                )}
            </div>
        </div>
    );
};

export default IngredientInput;
