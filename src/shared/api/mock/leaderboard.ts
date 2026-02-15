import type { ProcessedLeaderboard } from '@/shared/types'

/**
 * Mock pre-processed leaderboard data for development
 * This simulates data that has already been processed by the backend:
 * - Times in milliseconds (not nanoseconds)
 * - Car classes detected
 * - Theoretical best calculated
 * - Sorted by best lap
 */
export const mockLeaderboardData: ProcessedLeaderboard = {
  serverName: 'YoklmnRacing AC Server #7',
  track: 'Spa-Francorchamps',
  sessionName: 'Practice Session',
  lastUpdate: new Date().toISOString(),
  leaderboard: [
    {
      id: '76561198044424571_ks_mercedes_amg_gt3',
      driverName: 'Max Verstappen',
      carName: 'Mercedes AMG GT3',
      carModel: 'ks_mercedes_amg_gt3',
      carClass: 'GT3',
      teamName: 'Team Redline',
      bestLap: 143567, // 2:23.567
      splits: [32145, 45234, 36789, 29399],
      bestLapSplits: [32145, 45234, 36789, 29399],
      theoreticalBestLap: 143567,
      lapCount: 15,
    },
    {
      id: '76561198044424572_ks_porsche_911_gt3_r_2016',
      driverName: 'Lewis Hamilton',
      carName: 'Porsche 911 GT3 R 2016',
      carModel: 'ks_porsche_911_gt3_r_2016',
      carClass: 'GT3',
      teamName: 'Mercedes-AMG Petronas',
      bestLap: 144123, // 2:24.123
      splits: [31987, 45567, 36234, 30335],
      bestLapSplits: [32234, 45567, 36234, 30088],
      theoreticalBestLap: 144123,
      lapCount: 18,
    },
    {
      id: '76561198044424573_ks_audi_r8_lms_2016',
      driverName: 'Charles Leclerc',
      carName: 'Audi R8 LMS 2016',
      carModel: 'ks_audi_r8_lms_2016',
      carClass: 'GT3',
      teamName: 'Scuderia Ferrari',
      bestLap: 145789, // 2:25.789
      splits: [32456, 46123, 36987, 30223],
      bestLapSplits: [32789, 46123, 36654, 30223],
      theoreticalBestLap: 145789,
      lapCount: 12,
    },
    {
      id: '76561198044424574_ks_mclaren_650s_gt3',
      driverName: 'Lando Norris',
      carName: 'McLaren 650S GT3',
      carModel: 'ks_mclaren_650s_gt3',
      carClass: 'GT3',
      teamName: 'McLaren F1 Team',
      bestLap: 146234, // 2:26.234
      splits: [32678, 46456, 37123, 29977],
      bestLapSplits: [33012, 46456, 37123, 29643],
      theoreticalBestLap: 146234,
      lapCount: 14,
    },
    {
      id: '76561198044424575_ks_porsche_cayman_gt4_clubsport',
      driverName: 'George Russell',
      carName: 'Porsche Cayman GT4 Clubsport',
      carModel: 'ks_porsche_cayman_gt4_clubsport',
      carClass: 'GT4',
      teamName: 'Mercedes-AMG Petronas',
      bestLap: 152345, // 2:32.345
      splits: [34567, 48234, 38765, 30779],
      bestLapSplits: [34567, 48234, 38765, 30779],
      theoreticalBestLap: 152345,
      lapCount: 16,
    },
    {
      id: '76561198044424576_ks_bmw_m4_gt4',
      driverName: 'Carlos Sainz',
      carName: 'BMW M4 GT4',
      carModel: 'ks_bmw_m4_gt4',
      carClass: 'GT4',
      teamName: 'Scuderia Ferrari',
      bestLap: 153678, // 2:33.678
      splits: [34879, 48567, 39123, 31109],
      bestLapSplits: [35012, 48567, 39123, 30976],
      theoreticalBestLap: 153678,
      lapCount: 11,
    },
    {
      id: '76561198044424577_ks_porsche_991_carrera_cup',
      driverName: 'Fernando Alonso',
      carName: 'Porsche 991 Carrera Cup',
      carModel: 'ks_porsche_991_carrera_cup',
      carClass: 'Porsche Cup',
      teamName: 'Aston Martin F1 Team',
      bestLap: 149876, // 2:29.876
      splits: [33456, 47234, 37987, 31199],
      bestLapSplits: [33456, 47234, 37987, 31199],
      theoreticalBestLap: 149876,
      lapCount: 13,
    },
    {
      id: '76561198044424578_ks_alfa_romeo_giulietta_qv',
      driverName: 'Sergio Perez',
      carName: 'Alfa Romeo Giulietta QV',
      carModel: 'ks_alfa_romeo_giulietta_qv',
      carClass: 'Super Production',
      teamName: 'Oracle Red Bull Racing',
      bestLap: 165432, // 2:45.432
      splits: [37234, 52123, 41876, 34199],
      bestLapSplits: [37234, 52123, 41876, 34199],
      theoreticalBestLap: 165432,
      lapCount: 9,
    },
    {
      id: '76561198044424579_ks_ferrari_488_gtb',
      driverName: 'Oscar Piastri',
      carName: 'Ferrari 488 GTB',
      carModel: 'ks_ferrari_488_gtb',
      carClass: 'Other',
      teamName: 'McLaren F1 Team',
      bestLap: null, // No lap time yet
      splits: [],
      bestLapSplits: [],
      theoreticalBestLap: null,
      lapCount: 2,
    },
    {
      id: '76561198044424580_ks_lamborghini_huracan_gt3',
      driverName: 'Pierre Gasly',
      carName: 'Lamborghini Huracán GT3',
      carModel: 'ks_lamborghini_huracan_gt3',
      carClass: 'GT3',
      teamName: 'BWT Alpine F1 Team',
      bestLap: 147654, // 2:27.654
      splits: [32987, 46789, 37456, 30422],
      bestLapSplits: [33123, 46789, 37654, 30088],
      theoreticalBestLap: 147654,
      lapCount: 10,
    },
  ],
}
