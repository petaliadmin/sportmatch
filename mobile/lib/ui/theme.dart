import 'package:flutter/material.dart';

/// Couleurs du design system SportMatch (DESIGN_SYSTEM.md).
class Brand {
  static const background = Color(0xFF101A17);
  static const surface = Color(0xFF17231F);
  static const surface2 = Color(0xFF202D28);
  static const lime = Color(0xFFB7F34A);
  static const onLime = Color(0xFF101A17);
  static const muted = Color(0xFF9AA8A2);
  static const danger = Color(0xFFFF6B5E);
  static const gold = Color(0xFFF5C451);
}

ThemeData sportMatchTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: Brand.lime,
    brightness: Brightness.dark,
    primary: Brand.lime,
    onPrimary: Brand.onLime,
    surface: Brand.surface,
    error: Brand.danger,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: Brand.background,
    appBarTheme: const AppBarTheme(backgroundColor: Brand.background, elevation: 0, centerTitle: false),
    cardTheme: CardThemeData(
      color: Brand.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Brand.surface2)),
    ),
    navigationBarTheme: const NavigationBarThemeData(backgroundColor: Brand.surface, indicatorColor: Brand.surface2),
    chipTheme: const ChipThemeData(backgroundColor: Brand.surface2, side: BorderSide.none),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Brand.surface2,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
    ),
  );
}
