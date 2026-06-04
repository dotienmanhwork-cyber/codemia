export const AuthLayout = ({ children, bannerImage }) => (
  <div className="h-[calc(100vh-64px)] w-full flex flex-col md:flex-row bg-white overflow-hidden">

    {/* Left: Banner Image — full clean, no overlay */}
    <div className="hidden md:block md:w-1/2 h-full relative overflow-hidden">
      {bannerImage ? (
        <img
          src={bannerImage}
          alt="Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-[#181a1c]" />
      )}
    </div>

    {/* Right: Form */}
    <div className="w-full md:w-1/2 h-full flex items-start justify-center py-8 px-8 overflow-y-auto">
      <div className="w-full max-w-md">{children}</div>
    </div>

  </div>
);