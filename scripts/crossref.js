/**
 * Ravenol → Ultra1Plus Product Crossreference
 *
 * This script reads all JSON data files in public/data/ and replaces
 * Ravenol product names with Ultra1Plus equivalents, storing both
 * the original and the crossreferenced product.
 */

const fs = require('fs');
const path = require('path');

// ─── Crossreference Map: Ravenol product → Ultra1Plus equivalent ───────────

const crossref = {
  // ═══ ENGINE OILS ═══

  // 0W-16
  'RAVENOL EFE SAE 0W-16': { name: 'Ultra1Plus SAE 0W-16 Full Synthetic Motor Oil', sku: 'UFS016SPGF6A' },
  'RAVENOL HFE SAE 5W-16': { name: 'Ultra1Plus SAE 0W-16 Full Synthetic Motor Oil', sku: 'UFS016SPGF6A' },

  // 0W-20
  'RAVENOL ECS SAE 0W-20': { name: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', sku: 'UFS020SPGF6A' },
  'RAVENOL EFS SAE 0W-20': { name: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', sku: 'UFS020SPGF6A' },
  'RAVENOL EHS SAE 0W-20': { name: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', sku: 'UFS020SPGF6A' },
  'RAVENOL DFE SAE 0W-20': { name: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', sku: 'UFS020SPGF6A' },
  'RAVENOL VSE SAE 0W-20': { name: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', sku: 'UFS020SPGF6A' },
  'RAVENOL VSH SAE 0W-20': { name: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', sku: 'UFS020SPGF6A' },
  'RAVENOL LDD SAE 0W-20': { name: 'Ultra1Plus SAE 0W-20 Full Synthetic Motor Oil', sku: 'UFS020SPGF6A' },

  // 0W-30
  'RAVENOL ALS SAE 0W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL FES SAE 0W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL SSO SAE 0W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL SSV SAE 0W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL VSF SAE 0W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL VSW SAE 0W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL WIV SAE 0W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },

  // 0W-40
  'RAVENOL SHL SAE 0W-40': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },
  'RAVENOL SSL SAE 0W-40': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },

  // 5W-20
  'RAVENOL SFE SAE 5W-20': { name: 'Ultra1Plus SAE 5W-20 Full Synthetic Motor Oil', sku: 'UFS0520SPGF6A' },
  'RAVENOL GFE SAE 5W-20': { name: 'Ultra1Plus SAE 5W-20 Full Synthetic Motor Oil', sku: 'UFS0520SPGF6A' },

  // 5W-30
  'RAVENOL HCL SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL HDS SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL HLS SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL HPS SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL FDS SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL FEL SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL FLJ SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL FO SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL VMP SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL DXG SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL EDT SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL SVE SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL RNV SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL Super Performance Truck SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },
  'RAVENOL Super Synthetic Truck SAE 5W-30': { name: 'Ultra1Plus SAE 5W-30 Full Synthetic Motor Oil', sku: 'UFS0530SPGF6A' },

  // 5W-40
  'RAVENOL HCS SAE 5W-40': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },
  'RAVENOL HST SAE 5W-40': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },
  'RAVENOL HST SAE 5W-40 ': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },
  'RAVENOL RUP SAE 5W-40': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },
  'RAVENOL VDL SAE 5W-40': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },
  'RAVENOL VMO SAE 5W-40': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },
  'RAVENOL VSI SAE 5W-40': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },
  'RAVENOL VST SAE 5W-40': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },
  'RAVENOL NDT Nord Duty Truck SAE 5W-40': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },
  'RAVENOL HVT SAE 5W-50': { name: 'Ultra1Plus SAE 5W-40 Full Synthetic 4T Engine Oil', sku: 'UFS05404TSNMA2' },

  // 10W-30
  'RAVENOL Formel Standard SAE 10W-30': { name: 'Ultra1Plus SAE 10W-30 Conventional Motor Oil API SL', sku: 'UC1030SL' },
  'RAVENOL TSJ SAE 10W-30': { name: 'Ultra1Plus SAE 10W-30 Conventional Motor Oil API SL', sku: 'UC1030SL' },
  'RAVENOL STOU SAE 10W-30': { name: 'Ultra1Plus SAE 10W-30 Conventional Motor Oil API SL', sku: 'UC1030SL' },

  // 10W-40
  'RAVENOL TSI SAE 10W-40': { name: 'Ultra1Plus SAE 10W-40 Full Synthetic 4T Engine Oil', sku: 'UFS10404TSNMA2' },
  'RAVENOL DLO SAE 10W-40': { name: 'Ultra1Plus SAE 10W-40 Synthetic Blend Motor Oil', sku: 'USB1040SP' },
  'RAVENOL STOU SAE 10W-40': { name: 'Ultra1Plus SAE 10W-40 Synthetic Blend Motor Oil', sku: 'USB1040SP' },
  'RAVENOL Expert SHPD SAE 10W-40': { name: 'Ultra1Plus SAE 10W-40 Synthetic Blend Motor Oil', sku: 'USB1040SP' },
  'RAVENOL EURO VI Truck SAE 10W-40': { name: 'Ultra1Plus SAE 10W-40 Synthetic Blend Motor Oil', sku: 'USB1040SP' },
  'RAVENOL TEG Gasmotorenöl SAE 10W-40': { name: 'Ultra1Plus SAE 10W-40 Synthetic Blend Motor Oil', sku: 'USB1040SP' },

  // 10W-50 / 10W-60
  'RAVENOL HVE SAE 10W-50': { name: 'Ultra1Plus SAE 10W-40 Full Synthetic 4T Engine Oil', sku: 'UFS10404TSNMA2' },
  'RAVENOL HVS SAE 10W-60': { name: 'Ultra1Plus SAE 10W-40 Full Synthetic 4T Engine Oil', sku: 'UFS10404TSNMA2' },
  'RAVENOL RSS SAE 10W-60': { name: 'Ultra1Plus SAE 10W-40 Full Synthetic 4T Engine Oil', sku: 'UFS10404TSNMA2' },

  // 15W-40
  'RAVENOL Formel Super SAE 15W-40': { name: 'Ultra1Plus SAE 15W-40 Full Synthetic Heavy-Duty Motor Oil', sku: 'UFS1540CK4SN' },
  'RAVENOL Turbo-C HD-C SAE 15W-40': { name: 'Ultra1Plus SAE 15W-40 Full Synthetic Heavy-Duty Motor Oil', sku: 'UFS1540CK4SN' },
  'RAVENOL CATOEL TO-4 SAE 30': { name: 'Ultra1Plus SAE 15W-40 Full Synthetic Heavy-Duty Motor Oil', sku: 'UFS1540CK4SN' },

  // 20W-50
  'RAVENOL SAE 20W-50': { name: 'Ultra1Plus SAE 20W-50 Full Synthetic 4T Engine Oil', sku: 'UFS20504TSNMA2' },

  // ═══ AUTOMATIC TRANSMISSION FLUIDS ═══

  'RAVENOL ATF Dexron III H': { name: 'Ultra1Plus ATF Dexron III/Mercon Multi-Purpose', sku: 'UCDIIIMMPL' },
  'RAVENOL ATF Dexron D II': { name: 'Ultra1Plus ATF Dexron III/Mercon Multi-Purpose', sku: 'UCDIIIMMPL' },
  'RAVENOL ATF Dexron II E': { name: 'Ultra1Plus ATF Dexron III/Mercon Multi-Purpose', sku: 'UCDIIIMMPL' },
  'RAVENOL ATF Dexron F III': { name: 'Ultra1Plus ATF Dexron III/Mercon Multi-Purpose', sku: 'UCDIIIMMPL' },
  'RAVENOL ATF Fluid ATF': { name: 'Ultra1Plus ATF Dexron III/Mercon Multi-Purpose', sku: 'UCDIIIMMPL' },
  'RAVENOL ATF Fluid Type F': { name: 'Ultra1Plus ATF Dexron III/Mercon Multi-Purpose', sku: 'UCDIIIMMPL' },
  'RAVENOL ATF Matic Fluid Type D': { name: 'Ultra1Plus ATF Dexron III/Mercon Multi-Purpose', sku: 'UCDIIIMMPL' },

  'RAVENOL ATF Dexron VI': { name: 'Ultra1Plus ATF Dexron VI Full Synthetic Transmission Fluid Multi-Vehicle', sku: 'UFSATFDVIMV' },
  'RAVENOL ATF MERCON V': { name: 'Ultra1Plus ATF Dexron VI Full Synthetic Transmission Fluid Multi-Vehicle', sku: 'UFSATFDVIMV' },
  'RAVENOL Mercon LV': { name: 'Ultra1Plus ATF LV Full Synthetic Euro Rennsport Transmission Fluid', sku: 'U1PATFER' },

  'RAVENOL ATF 5/4 HP Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF 6HP Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF 8HP Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF M 9-FE': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF M 9-G Serie': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF M 9-Serie': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF MM SP-III Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF SP-IV Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF SP-IV RR': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF T-IV Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF T-ULV Fluid': { name: 'Ultra1Plus ATF LV Full Synthetic Euro Rennsport Transmission Fluid', sku: 'U1PATFER' },
  'RAVENOL ATF T-WS Lifetime': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF Type J2/S Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF Type Z1 Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF BTR 95LE': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF DW-1 Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF DPS Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF DSIH 6': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF JF405E': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF JF506E': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF RED-1': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL ATF ULV D-M': { name: 'Ultra1Plus ATF LV Full Synthetic Euro Rennsport Transmission Fluid', sku: 'U1PATFER' },
  'RAVENOL ATF+4® Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },

  // CVT
  'RAVENOL ATF CVT Fluid': { name: 'Ultra1Plus CVT Full Synthetic Universal Transmission Fluid', sku: 'UFSCU' },
  'RAVENOL ATF CVT HCF-2': { name: 'Ultra1Plus CVT Full Synthetic Universal Transmission Fluid', sku: 'UFSCU' },
  'RAVENOL ATF CVT KFE Fluid': { name: 'Ultra1Plus CVT Full Synthetic Universal Transmission Fluid', sku: 'UFSCU' },
  'RAVENOL ATF CVTF NS2/J1 Fluid': { name: 'Ultra1Plus CVT Full Synthetic Universal Transmission Fluid', sku: 'UFSCU' },
  'RAVENOL ATF CVTF NS3/J4 Fluid': { name: 'Ultra1Plus CVT Full Synthetic Universal Transmission Fluid', sku: 'UFSCU' },

  // DCT / DSG
  'RAVENOL ATF DCT/DSG Getriebe Fluid': { name: 'Ultra1Plus DCT Full Synthetic Universal Transmission Fluid', sku: 'UFSDCT' },
  'RAVENOL ATF DCT-F3': { name: 'Ultra1Plus DCT Full Synthetic Universal Transmission Fluid', sku: 'UFSDCT' },
  'RAVENOL DCT-DSG LV Fluid': { name: 'Ultra1Plus DCT Full Synthetic Universal Transmission Fluid', sku: 'UFSDCT' },
  'RAVENOL PDK Fluid': { name: 'Ultra1Plus DCT Full Synthetic Universal Transmission Fluid', sku: 'UFSDCT' },

  // ═══ GEAR OILS ═══

  'RAVENOL VSG SAE 75W-90': { name: 'Ultra1Plus SAE 75W-90 Synthetic Gear Oil API GL-4', sku: 'UFS7590GL4' },
  'RAVENOL TGO SAE 75W-90': { name: 'Ultra1Plus SAE 75W-90 Synthetic Gear Lube API GL-5', sku: 'UFS7590GL5' },
  'RAVENOL TSG SAE 75W-90': { name: 'Ultra1Plus SAE 75W-90 Synthetic Gear Lube API GL-5', sku: 'UFS7590GL5' },
  'RAVENOL LS 75W-90': { name: 'Ultra1Plus SAE 75W-90 Synthetic Gear Lube API GL-5', sku: 'UFS7590GL5' },
  'RAVENOL SLS SAE 75W-140': { name: 'Ultra1Plus SAE 75W-140 Synthetic Gear Oil', sku: 'UFS75140GL5' },
  'RAVENOL MTF-1 SAE 75W-85': { name: 'Ultra1Plus SAE 75W-80 Synthetic HD Transmission Fluid', sku: 'UFS7580GL4' },
  'RAVENOL MTF-2 SAE 75W-80': { name: 'Ultra1Plus SAE 75W-80 Synthetic HD Transmission Fluid', sku: 'UFS7580GL4' },
  'RAVENOL MTF-3 SAE 75W': { name: 'Ultra1Plus SAE 75W-80 Synthetic HD Transmission Fluid', sku: 'UFS7580GL4' },
  'RAVENOL PSA SAE 75W-80': { name: 'Ultra1Plus SAE 75W-80 Synthetic HD Transmission Fluid', sku: 'UFS7580GL4' },
  'RAVENOL VGL SAE 70W-80': { name: 'Ultra1Plus SAE 75W-80 Synthetic HD Transmission Fluid', sku: 'UFS7580GL4' },
  'RAVENOL DGL SAE 75W-85': { name: 'Ultra1Plus SAE 75W-80 Synthetic HD Transmission Fluid', sku: 'UFS7580GL4' },
  'RAVENOL SLG SAE 80W-90': { name: 'Ultra1Plus SAE 80W-90 Conventional Gear Oil', sku: 'UC8090GL5' },
  'RAVENOL Getriebeöl EPX SAE 80W-90': { name: 'Ultra1Plus SAE 80W-90 Conventional Gear Oil', sku: 'UC8090GL5' },
  'RAVENOL Getriebeöl MZG SAE 80W-90': { name: 'Ultra1Plus SAE 80W-90 Conventional Gear Oil', sku: 'UC8090GL5' },
  'RAVENOL Getriebeöl EPX SAE 80': { name: 'Ultra1Plus SAE 80W-90 Conventional Gear Oil', sku: 'UC8090GL5' },
  'RAVENOL Getriebeöl MZG SAE 80': { name: 'Ultra1Plus SAE 80W-90 Conventional Gear Oil', sku: 'UC8090GL5' },
  'RAVENOL Getriebeöl EPX SAE 85W-140': { name: 'Ultra1Plus SAE 85W-140 Conventional Gear Oil', sku: 'UC851409L5' },
  'RAVENOL Sperrdifferential Hypoid Getriebeöl LS SAE 85W-90': { name: 'Ultra1Plus SAE 85W-140 Conventional Gear Oil', sku: 'UC851409L5' },
  'RAVENOL Sperrdifferential Hypoid Getriebeöl LS SAE 90': { name: 'Ultra1Plus SAE 90 Conventional Gear Oil, API GL-5', sku: 'UC90GL5' },
  'RAVENOL Getriebeöl EPX SAE 90': { name: 'Ultra1Plus SAE 90 Conventional Gear Oil, API GL-5', sku: 'UC90GL5' },
  'RAVENOL Getriebeöl MZG SAE 90': { name: 'Ultra1Plus SAE 90 Conventional Gear Oil, API GL-5', sku: 'UC90GL5' },
  'RAVENOL Getriebeöl EPX SAE 140': { name: 'Ultra1Plus SAE 140 Conventional Gear Oil', sku: 'UC140GL5' },
  'RAVENOL STF Synchromesh Transmission Fluid': { name: 'Ultra1Plus SAE 75W-90 Synthetic Gear Oil API GL-4', sku: 'UFS7590GL4' },
  'RAVENOL MDL Multi-Disc locking differentials': { name: 'Ultra1Plus SAE 75W-90 Synthetic Gear Lube API GL-5', sku: 'UFS7590GL5' },
  'RAVENOL AWD-H Fluid': { name: 'Ultra1Plus SAE 75W-90 Synthetic Gear Lube API GL-5', sku: 'UFS7590GL5' },
  'RAVENOL AWD-TOR Fluid': { name: 'Ultra1Plus SAE 75W-90 Synthetic Gear Lube API GL-5', sku: 'UFS7590GL5' },
  'RAVENOL Transfer Fluid DTF-1': { name: 'Ultra1Plus SAE 75W-90 Synthetic Gear Lube API GL-5', sku: 'UFS7590GL5' },
  'RAVENOL AHC Active Height Control Fluid': { name: 'Ultra1Plus SAE 75W-90 Synthetic Gear Lube API GL-5', sku: 'UFS7590GL5' },

  // ═══ BRAKE FLUID ═══

  'RAVENOL DOT 4': { name: 'Ultra1Plus DOT 4 Brake Fluid', sku: 'U1PDOT4' },
  'RAVENOL DOT 4 LV': { name: 'Ultra1Plus DOT 4 Brake Fluid', sku: 'U1PDOT4' },
  'RAVENOL Racing Brake Fluid 325+': { name: 'Ultra1Plus DOT 4 Brake Fluid', sku: 'U1PDOT4' },

  // ═══ COOLANT / ANTIFREEZE ═══

  'RAVENOL TTC Concentrate Protect C11': { name: 'UltraCool Green IAT Universal Antifreeze & Coolant Premixed 50/50', sku: 'UAC5050G' },
  'RAVENOL TTC Premix -40°C Protect C11': { name: 'UltraCool Green IAT Universal Antifreeze & Coolant Premixed 50/50', sku: 'UAC5050G' },
  'RAVENOL TTC Premix -40Â°C Protect C11 ': { name: 'UltraCool Green IAT Universal Antifreeze & Coolant Premixed 50/50', sku: 'UAC5050G' },
  'RAVENOL OTC Concentrate Protect C12+': { name: 'UltraCool Orange IAT Universal Antifreeze & Coolant Concentrate', sku: 'UACCONO' },
  'RAVENOL OTC Premix -40°C Protect C12+': { name: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Premixed 50/50', sku: 'UACEL5050O' },
  'RAVENOL OTC Premix -40Â°C Protect C12+': { name: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Premixed 50/50', sku: 'UACEL5050O' },
  'RAVENOL LTC Concentrate Protect C12++': { name: 'UltraCool Orange OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', sku: 'UACELCONO' },
  'RAVENOL HTC Concentrate Protect MB 325.0': { name: 'UltraCool Blue OAT NAPS-Free Extended Life Antifreeze & Coolant Concentrate', sku: 'UACELCONB' },
  'RAVENOL HTC Premix -40Â°C Protect MB 325.0 ': { name: 'UltraCool Blue IAT Universal Antifreeze & Coolant Premixed 50/50', sku: 'UAC5050B' },
  'RAVENOL HJC Concentrate Protect FL 22': { name: 'UltraCool Violet Pink OAT Extended Life Antifreeze & Coolant Concentrate', sku: 'UACELCONV' },
  'RAVENOL HJC Premix -40°C Protect FL 22': { name: 'UltraCool Violet Pink OAT Extended Life Antifreeze & Coolant Concentrate', sku: 'UACELCONV' },
  'RAVENOL HJC Premix -40Â°C Protect FL 22': { name: 'UltraCool Violet Pink OAT Extended Life Antifreeze & Coolant Concentrate', sku: 'UACELCONV' },
  'RAVENOL LGC Concentrate Protect C13': { name: 'UltraCool Violet Pink OAT Extended Life Antifreeze & Coolant Concentrate', sku: 'UACELCONV' },

  // ═══ POWER STEERING / HYDRAULIC ═══

  'RAVENOL Hydrauliköl PSF Fluid': { name: 'Ultra1Plus Conventional Power Steering Fluid', sku: 'UCPS' },
  'RAVENOL HydraulikÃ¶l PSF Fluid': { name: 'Ultra1Plus Conventional Power Steering Fluid', sku: 'UCPS' },
  'RAVENOL Hydrauliköl PSF-Y Fluid': { name: 'Ultra1Plus Conventional Power Steering Fluid', sku: 'UCPS' },
  'RAVENOL HydraulikÃ¶l PSF-Y Fluid': { name: 'Ultra1Plus Conventional Power Steering Fluid', sku: 'UCPS' },
  'RAVENOL SSF Special Servolenkung Fluid': { name: 'Ultra1Plus Conventional Power Steering Fluid', sku: 'UCPS' },
  'RAVENOL E-PSF Fluid': { name: 'Ultra1Plus Conventional Power Steering Fluid', sku: 'UCPS' },
  'RAVENOL ESF Extra Servo Fluid': { name: 'Ultra1Plus Conventional Power Steering Fluid', sku: 'UCPS' },
  'RAVENOL LHM Plus Fluid': { name: 'Ultra1Plus Conventional Power Steering Fluid', sku: 'UCPS' },
  'RAVENOL Hydrauliköl TS 32': { name: 'Ultra1Plus Conventional Power Steering Fluid', sku: 'UCPS' },
  'RAVENOL HydraulikÃ¶l TS 32': { name: 'Ultra1Plus Conventional Power Steering Fluid', sku: 'UCPS' },

  // ═══ GREASE ═══

  'RAVENOL Extreme Pressure Grease EPG 3': { name: 'Ultra1Plus LITHIUM COMPLEX HT Multipurpose Grease Red #2', sku: 'U1P-GRHLCHTR' },
  'RAVENOL Hochleistungsfett mit MOS-2': { name: 'Ultra1Plus LITHIUM COMPLEX HT Multipurpose Grease Red #2', sku: 'U1P-GRHLCHTR' },
  'RAVENOL Hot Red Grease HRG 1': { name: 'Ultra1Plus LITHIUM COMPLEX HT Multipurpose Grease Red #2', sku: 'U1P-GRHLCHTR' },
  'RAVENOL KFZ-Fliessfett ZSA': { name: 'Ultra1Plus LITHIUM COMPLEX HT Multipurpose Grease Red #2', sku: 'U1P-GRHLCHTR' },
  'RAVENOL Mehrzweckfett OML': { name: 'Ultra1Plus LITHIUM COMPLEX HT Multipurpose Grease Red #2', sku: 'U1P-GRHLCHTR' },
  'RAVENOL Mehrzweckfett mit MOS-2': { name: 'Ultra1Plus LITHIUM COMPLEX HT Multipurpose Grease Red #2', sku: 'U1P-GRHLCHTR' },
  'RAVENOL Super EP-Langzeitfett': { name: 'Ultra1Plus LITHIUM COMPLEX HT Multipurpose Grease Red #2', sku: 'U1P-GRHLCHTR' },
  'RAVENOL Wälzlagerfett LI-86': { name: 'Ultra1Plus LITHIUM COMPLEX HT Multipurpose Grease Red #2', sku: 'U1P-GRHLCHTR' },
  'RAVENOL WÃ¤lzlagerfett LI-86': { name: 'Ultra1Plus LITHIUM COMPLEX HT Multipurpose Grease Red #2', sku: 'U1P-GRHLCHTR' },

  // ═══ SPECIALTY ═══

  'RAVENOL GHA-F Gearbox Actuator Fluid': { name: 'Ultra1Plus DCT Full Synthetic Universal Transmission Fluid', sku: 'UFSDCT' },

  // ═══ UTF-8 ENCODING VARIANTS (Ã¶ = ö, Â® = ®) ═══

  'RAVENOL ATF+4\u00c2\u00ae Fluid': { name: 'Ultra1Plus ATF Universal Full Synthetic Transmission Oil Optimum Elite HD', sku: 'UFSATFU' },
  'RAVENOL Getriebe\u00c3\u00b6l EPX SAE 140': { name: 'Ultra1Plus SAE 140 Conventional Gear Oil', sku: 'UC140GL5' },
  'RAVENOL Getriebe\u00c3\u00b6l EPX SAE 80': { name: 'Ultra1Plus SAE 80W-90 Conventional Gear Oil', sku: 'UC8090GL5' },
  'RAVENOL Getriebe\u00c3\u00b6l EPX SAE 80W-90': { name: 'Ultra1Plus SAE 80W-90 Conventional Gear Oil', sku: 'UC8090GL5' },
  'RAVENOL Getriebe\u00c3\u00b6l EPX SAE 85W-140': { name: 'Ultra1Plus SAE 85W-140 Conventional Gear Oil', sku: 'UC851409L5' },
  'RAVENOL Getriebe\u00c3\u00b6l EPX SAE 90': { name: 'Ultra1Plus SAE 90 Conventional Gear Oil, API GL-5', sku: 'UC90GL5' },
  'RAVENOL Getriebe\u00c3\u00b6l MZG SAE 80': { name: 'Ultra1Plus SAE 80W-90 Conventional Gear Oil', sku: 'UC8090GL5' },
  'RAVENOL Getriebe\u00c3\u00b6l MZG SAE 80W-90': { name: 'Ultra1Plus SAE 80W-90 Conventional Gear Oil', sku: 'UC8090GL5' },
  'RAVENOL Getriebe\u00c3\u00b6l MZG SAE 90': { name: 'Ultra1Plus SAE 90 Conventional Gear Oil, API GL-5', sku: 'UC90GL5' },
  'RAVENOL Sperrdifferential Hypoid Getriebe\u00c3\u00b6l LS SAE 85W-90': { name: 'Ultra1Plus SAE 85W-140 Conventional Gear Oil', sku: 'UC851409L5' },
  'RAVENOL Sperrdifferential Hypoid Getriebe\u00c3\u00b6l LS SAE 90': { name: 'Ultra1Plus SAE 90 Conventional Gear Oil, API GL-5', sku: 'UC90GL5' },
  'RAVENOL TEG Gasmotoren\u00c3\u00b6l SAE 10W-40': { name: 'Ultra1Plus SAE 10W-40 Synthetic Blend Motor Oil', sku: 'USB1040SP' },
  'RAVENOL TTC Premix -40\u00c2\u00b0C Protect C11': { name: 'UltraCool Green IAT Universal Antifreeze & Coolant Premixed 50/50', sku: 'UAC5050G' },
};

// ─── Process all JSON files ────────────────────────────────────────────────

const dataDir = path.join(__dirname, '..', 'public', 'data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'index.json');

let totalFiles = 0;
let totalFluids = 0;
let matched = 0;
let unmatched = new Set();

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!data.models) continue;
  totalFiles++;

  let modified = false;

  for (const model of data.models) {
    for (const type of model.types) {
      for (const fluid of type.fluids) {
        totalFluids++;

        if (!fluid.p || fluid.p === 'Special Product') continue;

        const trimmed = fluid.p.trim();
        const match = crossref[trimmed] || crossref[fluid.p];

        if (match) {
          // Store original Ravenol product as "ravenol" and replace "p" with Ultra1Plus
          fluid.ravenol = fluid.p.trim();
          fluid.p = match.name;
          fluid.u1pSku = match.sku;
          matched++;
          modified = true;
        } else {
          unmatched.add(fluid.p.trim());
        }
      }
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data));
  }
}

console.log('');
console.log('═══ Ravenol → Ultra1Plus Crossreference Complete ═══');
console.log('');
console.log(`Files processed:  ${totalFiles}`);
console.log(`Total fluids:     ${totalFluids}`);
console.log(`Matched:          ${matched}`);
console.log(`Unmatched unique: ${unmatched.size}`);
console.log('');

if (unmatched.size > 0) {
  console.log('Unmatched Ravenol products:');
  [...unmatched].sort().forEach(p => console.log(`  - ${p}`));
}
