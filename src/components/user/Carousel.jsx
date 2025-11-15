import React, { useState } from "react";

const images = [
  "https://cf.bstatic.com/xdata/images/hotel/max300/511451958.jpg?k=fd960ca3e7aea647ca69c1cb16ca017f44e08e27c33a543e8f8ae4b0a628598c&o=",
  "https://cf.bstatic.com/xdata/images/hotel/max500/511671382.jpg?k=bc540afc8371eb57f5506fdd59599d51c61f80473c109d55c4ce1062ee7d2944&o=",
  "https://cf.bstatic.com/xdata/images/hotel/max1024x768/511671345.jpg?k=b7231358a144d9b60ee6d105125e71be93addeb4085a0aeb9c6412d72ea2efd4&o=",
  "https://cf.bstatic.com/xdata/images/hotel/max1024x768/511452017.jpg?k=6bb83e1d0dac2e53535f88518b6b984d9d0d22b10b82f344eaa2f9a13121f841&o=",
  "https://cf.bstatic.com/xdata/images/hotel/max1024x768/511671370.jpg?k=8c27b6f52bad1445e764028ae4bb2a924871556ae6e9f9b7f2d734f2fb8d22cd&o=",
];

const Carousel = () => {
  const [current, setCurrent] = useState(0);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-lg">
      {/* Carousel Wrapper */}
      <div className="relative h-64 sm:h-80 md:h-[500px] bg-black flex items-center justify-center">
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              index === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={img}
              alt={`Slide ${index}`}
              className="w-full h-full object-contain bg-black"
            />
          </div>
        ))}
      </div>

      {/* Prev Button */}
      <button
        onClick={prevSlide}
        className="absolute top-0 left-0 z-30 flex items-center justify-center h-full px-4 group"
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 transition">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 6 10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 1L1 5l4 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* Next Button */}
      <button
        onClick={nextSlide}
        className="absolute top-0 right-0 z-30 flex items-center justify-center h-full px-4 group"
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 transition">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 6 10"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m1 9 4-4-4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
};

export default Carousel;
