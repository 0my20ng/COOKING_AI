import React from 'react';
import { ChefHat, Clock, BarChart } from 'lucide-react';

interface Recommendation {
    name: string;
    reason: string;
    difficulty: string;
    time: string;
}

interface RecommendationListProps {
    recommendations: Recommendation[];
    onSelect: (dishName: string) => void;
}

export default function RecommendationList({ recommendations, onSelect }: RecommendationListProps) {
    if (!recommendations || recommendations.length === 0) return null;

    return (
        <div className="w-full mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center mb-4">
                <ChefHat className="w-6 h-6 text-orange-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-800">이런 요리는 어떠세요?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map((rec, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(rec.name)}
                        className="flex flex-col text-left bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-200 group"
                    >
                        <div className="flex justify-between items-start w-full mb-2">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors">
                                {rec.name}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${rec.difficulty === '쉬움' ? 'bg-green-100 text-green-700' :
                                    rec.difficulty === '보통' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                {rec.difficulty}
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 mb-4 flex-grow break-keep">
                            {rec.reason}
                        </p>

                        <div className="flex items-center text-xs text-gray-400 mt-auto">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{rec.time}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
