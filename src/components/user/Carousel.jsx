import React from 'react'

const Carousel = () => {
    return (
        <>
            <div id="controls-carousel" className="relative w-full" data-carousel="static">
                {/* Carousel wrapper */}
                <div className="relative h-56 overflow-hidden rounded-lg md:h-96">
                    {/* Item 1 */}
                    <div className=" duration-700 ease-in-out" data-carousel-item>
                        <img src="https://cdn.pixabay.com/photo/2025/06/03/05/11/louvre-9638315_1280.jpg" className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="..." />
                    </div>
                    {/* Item 2 */}
                    <div className=" duration-700 ease-in-out" data-carousel-item="active">
                        <img src="https://cdn.pixabay.com/photo/2025/06/03/05/11/louvre-9638315_1280.jpg" className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="..." />
                    </div>
                    {/* Item 3 */}
                    <div className=" duration-700 ease-in-out" data-carousel-item>
                        <img src="https://cdn.pixabay.com/photo/2013/04/11/19/46/building-102840_1280.jpg" className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="..." />
                    </div>
                    {/* Item 4 */}
                    <div className=" duration-700 ease-in-out" data-carousel-item>
                        <img src="https://cdn.pixabay.com/photo/2025/06/03/05/11/louvre-9638315_1280.jpg" className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="..." />
                    </div>
                    {/* Item 5 */}
                    <div className=" duration-700 ease-in-out" data-carousel-item>
                        <img src="https://cdn.pixabay.com/photo/2025/06/03/05/11/louvre-9638315_1280.jpg" className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="..." />
                    </div>
                </div>
                {/* Slider controls */}
                <button type="button" className="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-prev>
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
                        <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 1 1 5l4 4" />
                        </svg>
                        <span className="sr-only">Previous</span>
                    </span>
                </button>
                <button type="button" className="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-next>
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
                        <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                        </svg>
                        <span class="sr-only">Next</span>
                    </span>
                </button>
            </div>

        </>
    )
}

export default Carousel
