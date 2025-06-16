import Image from 'next/image'
import { Check } from 'lucide-react'
import BranchSection from '@/components/BranchSection'

// Optimized image data with placeholder blur
const staffImages = [
    {
        id: 1,
        src: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg',
        placeholder: 'data:image/svg+xml;base64,...'
    },
    // Add other staff images...
]

const CHURCH_ADDRESS = "914 Silver Spring Avenue Suite 204B, Silver Spring, MD 20910"
const CHURCH_COORDS = { lat: 38.9907, lng: -77.0261 }

const churchStaff = [
    {
        id: 1,
        name: "Pastor John Smith",
        role: "Senior Pastor",
        image: staffImages[0].src,
        placeholder: staffImages[0].placeholder,
        bio: "Leading our church since 2010 with wisdom and compassion."
    },
    // Other staff members...
]

const branches = [
    {
        id: 1,
        name: "Main Campus",
        address: CHURCH_ADDRESS,
        services: "Sunday 9:00 AM & 11:00 AM",
        image: "https://images.pexels.com/photos/2693529/pexels-photo-2693529.jpeg",
        placeholder: 'data:image/svg+xml;base64,...',
        coords: CHURCH_COORDS
    },
    // Other branches...
]

export default function AboutPage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative h-[400px] md:h-[500px] overflow-hidden">
                <Image
                    src="https://images.pexels.com/photos/175130/pexels-photo-175130.jpeg"
                    alt="About Our Church"
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,..."
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="container-custom relative z-10 h-full flex flex-col justify-center items-center text-center text-white">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                        About Our Church
                    </h1>
                    <p className="text-xl max-w-2xl">
                        A community of believers committed to loving God and serving others
                    </p>
                </div>
            </section>

            {/* Vision & Mission */}
            <section className="py-16">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">ራዕያችን</h2>
                            <p className="text-lg mb-6">
                                በመንፈስ ቅዱስና በእግዚአብሔር ቃል የተሞሉ፤ የደቀ መዝሙርነትን ሕይወት በወንጌል ስብከትና በኑሮ የሚገልጡ አማኞችን እያፈራች፤ ዘመኑን እየዋጀች፤ የጌታን ምፅዓት እያወጀችና አባላቷንም እያዘጋጀች የእግዚአብሔር ሕልውና የተገለጠባት ቅድስት ቤተክርስቲያን ሆና ማየት
                            </p>
                            <div className="bg-church-primary/5 p-6 rounded-lg border-l-4 border-church-primary">
                                <p className="italic">
                                    &quot;በእርሱ የሚያምን ሁሉ የዘላለም ሕይወት እንዲኖረው እንጂ እንዳይጠፋ እግዚአብሔር አንድያ ልጁን እስኪሰጥ ድረስ ዓለሙን እንዲሁ ወዶአልና።&quot;
                                </p>
                                <p className="text-right mt-2">- ዮሐንስ 3:16</p>
                            </div>
                        </div>

                        <div>
                            <h2 className="text-3xl font-bold mb-6">ተልዕኳችን</h2>
                            <p className="text-lg mb-6">
                                ወንጌልን በመንፈስ ቅዱስ ምሪት በአጥቢያ ቤተክርስቲያኒቱ ክልል ላሉ ሰዎችና በሀገሪቱ ብሎም በዓለም ዙሪያ በልዩ ልዩ መንገድ በመስበክ ሰዎችን ለእግዚአብሔር መንግስት መዋጀትና ያመኑትንም የእግዚአብሔርን ቃል በማስተማርና በማጥመቅ ደቀ መዛሙርት ማድረግ
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "Authentic worship",
                                    "Biblical teaching",
                                    "Loving community",
                                    "Generous service"
                                ].map((item, index) => (
                                    <li key={index} className="flex items-start">
                                        <Check className="h-5 w-5 text-church-primary mr-2 mt-1" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statement of Faith */}
            <section className="py-16 bg-gray-50">
                <div className="container-custom">
                    <h2 className="text-3xl font-bold text-center mb-10">Our Beliefs</h2>
                    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm">
                        {[
                            {
                                title: "The Bible",
                                content: "We believe the Bible is the inspired, authoritative Word of God."
                            },
                            {
                                title: "God",
                                content: "We believe in one God eternally existing in three persons."
                            },
                            // Add other beliefs...
                        ].map((belief, index) => (
                            <div key={index} className="mb-6 last:mb-0">
                                <h3 className="text-xl font-bold text-church-primary mb-2">
                                    {belief.title}
                                </h3>
                                <p>{belief.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Leadership Team */}
            <section className="py-16">
                <div className="container-custom">
                    <h2 className="text-3xl font-bold text-center mb-10">Our Team</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {churchStaff.map((staff) => (
                            <div key={staff.id} className="text-center">
                                <div className="relative h-64 mb-4 overflow-hidden rounded-lg">
                                    <Image
                                        src={staff.image}
                                        alt={staff.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                        className="object-cover"
                                        placeholder="blur"
                                        blurDataURL={staff.placeholder}
                                    />
                                </div>
                                <h3 className="text-xl font-bold">{staff.name}</h3>
                                <p className="text-church-primary font-medium">{staff.role}</p>
                                <p className="text-gray-600 mt-2">{staff.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Locations Section */}
            <section className="py-16 bg-gray-50">
                <div className="container-custom">
                    <h2 className="text-3xl font-bold text-center mb-10">Our Locations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {branches.map((branch) => (
                            <BranchSection
                                key={branch.id}
                                {...branch}
                                branchLocation={branch.coords}
                                branchName={branch.name}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}