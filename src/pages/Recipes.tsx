// Titles and IDs match the channel's shorts: https://www.youtube.com/@TheNextProteinNepal/shorts
const recipes = [
  {
    title: 'The Next Protein Nepal Choila Recipe',
    videoId: 'oyE5jrAA18Y',
    desc: 'A delicious Nepali twist: smoky, spiced seitan mixed with mustard oil and traditional Nepali herbs.',
  },
  {
    title: 'The Next Protein Nepal Noodles Recipe!',
    videoId: 'Bx8ngsuJvc8',
    desc: 'Seitan stir-fried with noodles and fresh vegetables in a bold, flavorful Nepali-style sauce.',
  },
  {
    title: 'The Next Protein Nepal Protein Loaf Chilli Recipe!',
    videoId: '8OyGWwl3YZg',
    desc: 'Crispy seitan pieces tossed with peppers, onions and a spicy, tangy chilli sauce.',
  },
  {
    title: 'The Next Protein Nepal Biryani Recipe!',
    videoId: '8e3tsQR9quM',
    desc: 'Fragrant basmati rice layered with spiced seitan, aromatic herbs and warming spices.',
  },
  {
    title: 'The Next Protein Nepal Protein Loaf Curry!',
    videoId: 'RAzBHarjYGg',
    desc: 'Hearty seitan pieces simmered in a traditional Nepali curry with aromatic spices.',
  },
]

export default function Recipes() {
  return (
    <div className="pt-16">
      {/* Header */}
      <section className="bg-[#264F24] py-24">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
          <p className="font-display font-bold text-xs tracking-[0.2em] uppercase text-[#A8C879] mb-3">
            Watch & Cook
          </p>
          <h1 className="font-display font-black text-5xl lg:text-7xl text-[#F5EDE1] uppercase leading-none mb-6">
            Recipe <span className="text-[#A8C879]">Videos</span>
          </h1>
          <p className="font-body text-[#F5EDE1]/80 max-w-xl leading-relaxed">
            Watch how Protein Loaf comes to life in real Nepali kitchens — from smoky choila
            to fragrant biryani, follow along and cook it yourself.
          </p>
        </div>
      </section>

      {/* Video grid */}
      <section className="bg-[#FCFAF6] py-16 pb-24">
        <div className="max-w-[1240px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recipes.map((recipe) => (
              <article
                key={recipe.videoId}
                className="group bg-white rounded-2xl overflow-hidden border border-[#E8DDCD] hover:shadow-lg transition-shadow"
              >
                <div className="aspect-[9/16] bg-[#E8DDCD]">
                  <iframe
                    className="w-full h-full"
                    // Domain must be allowed by frame-src in vercel.json's CSP, or production blocks it.
                    src={`https://www.youtube-nocookie.com/embed/${recipe.videoId}`}
                    title={recipe.title}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display font-black text-lg text-[#22231F] leading-snug mb-3">
                    {recipe.title}
                  </h3>
                  <p className="font-body text-sm text-[#676A61] leading-relaxed">
                    {recipe.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
