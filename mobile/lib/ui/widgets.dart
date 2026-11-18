import 'package:flutter/material.dart';

import 'theme.dart';

/// Charge une donnée et gère les trois états : chargement, erreur (avec réessai), contenu.
class Loader<T> extends StatefulWidget {
  const Loader({super.key, required this.load, required this.builder, this.empty, this.embedded = false});

  final Future<T> Function() load;

  /// true quand le Loader est placé dans une liste déjà défilante (pas de RefreshIndicator imbriqué).
  final bool embedded;
  final Widget Function(BuildContext context, T data, Future<void> Function() reload) builder;
  final Widget? empty;

  @override
  State<Loader<T>> createState() => LoaderState<T>();
}

class LoaderState<T> extends State<Loader<T>> {
  late Future<T> _future = widget.load();

  Future<void> reload() async {
    final next = widget.load();
    setState(() => _future = next);
    try {
      await next;
    } on Exception {
      // l'erreur est affichée par le FutureBuilder
    }
  }

  @override
  Widget build(BuildContext context) => FutureBuilder<T>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState != ConnectionState.done) {
            return const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()));
          }
          if (snap.hasError) return ErrorView(message: '${snap.error}', onRetry: reload);
          final data = snap.data as T;
          final isEmpty = widget.empty != null && data is List && data.isEmpty;
          if (widget.embedded) return isEmpty ? widget.empty! : widget.builder(context, data, reload);
          if (isEmpty) return RefreshIndicator(onRefresh: reload, child: ListView(children: [widget.empty!]));
          return RefreshIndicator(onRefresh: reload, child: widget.builder(context, data, reload));
        },
      );
}

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.wifi_off_rounded, color: Brand.danger, size: 40),
            const SizedBox(height: 12),
            const Text('Impossible de charger les données', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Brand.muted)),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              OutlinedButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh), label: const Text('Réessayer')),
            ],
          ]),
        ),
      );
}

class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.icon, required this.title, required this.message});

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 64),
        child: Column(children: [
          Icon(icon, size: 44, color: Brand.lime),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 4),
          Text(message, textAlign: TextAlign.center, style: const TextStyle(color: Brand.muted)),
        ]),
      );
}

class Pill extends StatelessWidget {
  const Pill(this.label, {super.key, this.color = Brand.lime});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(99)),
        child: Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700)),
      );
}

void showMessage(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message), backgroundColor: error ? Brand.danger : null));
}

/// Exécute une action réseau et affiche le résultat ou l'erreur.
Future<T?> runAction<T>(BuildContext context, Future<T> Function() action, {String? success}) async {
  try {
    final result = await action();
    if (context.mounted && success != null) showMessage(context, success);
    return result;
  } on Exception catch (e) {
    if (context.mounted) showMessage(context, '$e', error: true);
    return null;
  }
}
