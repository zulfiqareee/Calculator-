export interface DistrictOption {
  nameBn: string;
  nameEn: string;
  lat: number;
  lon: number;
  divisionBn: string;
  divisionEn: string;
}

export const BANGLADESH_DISTRICTS: DistrictOption[] = [
  // Dhaka Division
  { nameBn: 'ঢাকা', nameEn: 'Dhaka', lat: 23.8103, lon: 90.4125, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'গাজীপুর', nameEn: 'Gazipur', lat: 24.0023, lon: 90.4264, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'নারায়ণগঞ্জ', nameEn: 'Narayanganj', lat: 23.6238, lon: 90.5000, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'মুন্সীগঞ্জ', nameEn: 'Munshiganj', lat: 23.5422, lon: 90.5305, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'নরসিংদী', nameEn: 'Narsingdi', lat: 23.9193, lon: 90.7202, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'মানিকগঞ্জ', nameEn: 'Manikganj', lat: 23.8617, lon: 90.0003, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'ফরিদপুর', nameEn: 'Faridpur', lat: 23.6071, lon: 89.8426, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'মাদারীপুর', nameEn: 'Madaripur', lat: 23.1641, lon: 90.1897, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'শরীয়তপুর', nameEn: 'Shariatpur', lat: 23.2423, lon: 90.4348, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'রাজবাড়ী', nameEn: 'Rajbari', lat: 23.7574, lon: 89.6445, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'গোপালগঞ্জ', nameEn: 'Gopalganj', lat: 23.0051, lon: 89.8266, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'কিশোরগঞ্জ', nameEn: 'Kishoreganj', lat: 24.4449, lon: 90.7766, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },
  { nameBn: 'টাঙ্গাইল', nameEn: 'Tangail', lat: 24.2513, lon: 89.9167, divisionBn: 'ঢাকা', divisionEn: 'Dhaka' },

  // Chittagong Division
  { nameBn: 'চট্টগ্রাম', nameEn: 'Chattogram', lat: 22.3569, lon: 91.7832, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'কক্সবাজার', nameEn: 'Cox\'s Bazar', lat: 21.4272, lon: 92.0058, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'কুমিল্লা', nameEn: 'Cumilla', lat: 23.4607, lon: 91.1809, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'ফেনী', nameEn: 'Feni', lat: 23.0159, lon: 91.3976, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'ব্রাহ্মণবাড়িয়া', nameEn: 'Brahmanbaria', lat: 23.9571, lon: 91.1119, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'নোয়াখালী', nameEn: 'Noakhali', lat: 22.8696, lon: 91.0993, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'লক্ষ্মীপুর', nameEn: 'Lakshmipur', lat: 22.9425, lon: 90.8412, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'চাঁদপুর', nameEn: 'Chandpur', lat: 23.2333, lon: 90.6667, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'রাঙ্গামাটি', nameEn: 'Rangamati', lat: 22.6533, lon: 92.1753, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'বান্দরবান', nameEn: 'Bandarban', lat: 22.1953, lon: 92.2184, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },
  { nameBn: 'খাগড়াছড়ি', nameEn: 'Khagrachhari', lat: 23.1193, lon: 91.9847, divisionBn: 'চট্টগ্রাম', divisionEn: 'Chattogram' },

  // Sylhet Division
  { nameBn: 'সিলেট', nameEn: 'Sylhet', lat: 24.8949, lon: 91.8687, divisionBn: 'সিলেট', divisionEn: 'Sylhet' },
  { nameBn: 'মৌলভীবাজার', nameEn: 'Moulvibazar', lat: 24.4829, lon: 91.7774, divisionBn: 'সিলেট', divisionEn: 'Sylhet' },
  { nameBn: 'হবিগঞ্জ', nameEn: 'Habiganj', lat: 24.3749, lon: 91.4155, divisionBn: 'সিলেট', divisionEn: 'Sylhet' },
  { nameBn: 'সুনামগঞ্জ', nameEn: 'Sunamganj', lat: 25.0658, lon: 91.3950, divisionBn: 'সিলেট', divisionEn: 'Sylhet' },

  // Rajshahi Division
  { nameBn: 'রাজশাহী', nameEn: 'Rajshahi', lat: 24.3636, lon: 88.6241, divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'বগুড়া', nameEn: 'Bogura', lat: 24.8465, lon: 89.3777, divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'পাবনা', nameEn: 'Pabna', lat: 24.0064, lon: 89.2372, divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'সিরাজগঞ্জ', nameEn: 'Sirajganj', lat: 24.4534, lon: 89.7008, divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'নাটোর', nameEn: 'Natore', lat: 24.4206, lon: 89.0003, divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'নওগাঁ', nameEn: 'Naogaon', lat: 24.7936, lon: 88.9318, divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'চাঁপাইনবাবগঞ্জ', nameEn: 'Chapai Nawabganj', lat: 24.5965, lon: 88.2775, divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },
  { nameBn: 'জয়পুরহাট', nameEn: 'Joypurhat', lat: 25.1015, lon: 89.0277, divisionBn: 'রাজশাহী', divisionEn: 'Rajshahi' },

  // Khulna Division
  { nameBn: 'খুলনা', nameEn: 'Khulna', lat: 22.8456, lon: 89.5403, divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'যশোর', nameEn: 'Jashore', lat: 23.1664, lon: 89.2182, divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'সাতক্ষীরা', nameEn: 'Satkhira', lat: 22.7185, lon: 89.0705, divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'কুষ্টিয়া', nameEn: 'Kushtia', lat: 23.9013, lon: 89.1205, divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'ঝিনাইদহ', nameEn: 'Jhenaidah', lat: 23.5448, lon: 89.1539, divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'মাগুরা', nameEn: 'Magura', lat: 23.4873, lon: 89.4199, divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'মেহেরপুর', nameEn: 'Meherpur', lat: 23.7622, lon: 88.6318, divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'চুয়াডাঙ্গা', nameEn: 'Chuadanga', lat: 23.6402, lon: 88.8418, divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'নড়াইল', nameEn: 'Narail', lat: 23.1725, lon: 89.5127, divisionBn: 'খুলনা', divisionEn: 'Khulna' },
  { nameBn: 'বাগেরহাট', nameEn: 'Bagerhat', lat: 22.6516, lon: 89.7859, divisionBn: 'খুলনা', divisionEn: 'Khulna' },

  // Barishal Division
  { nameBn: 'বরিশাল', nameEn: 'Barishal', lat: 22.7010, lon: 90.3535, divisionBn: 'বরিশাল', divisionEn: 'Barishal' },
  { nameBn: 'পটুয়াখালী', nameEn: 'Patuakhali', lat: 22.3596, lon: 90.3299, divisionBn: 'বরিশাল', divisionEn: 'Barishal' },
  { nameBn: 'ভোলা', nameEn: 'Bhola', lat: 22.6859, lon: 90.6481, divisionBn: 'বরিশাল', divisionEn: 'Barishal' },
  { nameBn: 'পিরোজপুর', nameEn: 'Pirojpur', lat: 22.5841, lon: 89.9720, divisionBn: 'বরিশাল', divisionEn: 'Barishal' },
  { nameBn: 'বরগুনা', nameEn: 'Barguna', lat: 22.0953, lon: 90.1121, divisionBn: 'বরিশাল', divisionEn: 'Barishal' },
  { nameBn: 'ঝালকাঠি', nameEn: 'Jhalokati', lat: 22.6406, lon: 90.1987, divisionBn: 'বরিশাল', divisionEn: 'Barishal' },

  // Rangpur Division
  { nameBn: 'রংপুর', nameEn: 'Rangpur', lat: 25.7439, lon: 89.2752, divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'দিনাজপুর', nameEn: 'Dinajpur', lat: 25.6217, lon: 88.6355, divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'গাইবান্ধা', nameEn: 'Gaibandha', lat: 25.3288, lon: 89.5408, divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'কুড়িগ্রাম', nameEn: 'Kurigram', lat: 25.8054, lon: 89.6362, divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'লালমনিরহাট', nameEn: 'Lalmonirhat', lat: 25.9923, lon: 89.2847, divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'নীলফামারী', nameEn: 'Nilphamari', lat: 25.9318, lon: 88.8560, divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'ঠাকুরগাঁও', nameEn: 'Thakurgaon', lat: 26.0337, lon: 88.4617, divisionBn: 'রংপুর', divisionEn: 'Rangpur' },
  { nameBn: 'পঞ্চগড়', nameEn: 'Panchagarh', lat: 26.3411, lon: 88.5542, divisionBn: 'রংপুর', divisionEn: 'Rangpur' },

  // Mymensingh Division
  { nameBn: 'ময়মনসিংহ', nameEn: 'Mymensingh', lat: 24.7471, lon: 90.4203, divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh' },
  { nameBn: 'জামালপুর', nameEn: 'Jamalpur', lat: 24.9375, lon: 89.9378, divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh' },
  { nameBn: 'শেরপুর', nameEn: 'Sherpur', lat: 25.0205, lon: 90.0153, divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh' },
  { nameBn: 'নেত্রকোণা', nameEn: 'Netrokona', lat: 24.8709, lon: 90.7279, divisionBn: 'ময়মনসিংহ', divisionEn: 'Mymensingh' },
];
