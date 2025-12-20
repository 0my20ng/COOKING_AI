import React from 'react';

const Header = () => {
    return (
        <header className="w-full py-8 text-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
                오늘 뭐 <span className="text-orange-500">해먹지?</span>
            </h1>
            <p className="mt-2 text-gray-500 text-sm md:text-base">
                냉장고 속 재료로 맛있는 레시피를 찾아보세요 🍳
            </p>
        </header>
    );
};

export default Header;
