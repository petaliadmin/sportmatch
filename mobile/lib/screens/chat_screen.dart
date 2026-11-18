import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

import '../api/models.dart';
import '../app.dart';
import '../config.dart';
import '../ui/format.dart';
import '../ui/theme.dart';
import '../ui/widgets.dart';
import 'home_shell.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scope = AppScope.of(context);
    if (!scope.session.signedIn) return const SignInPrompt(message: 'Connecte-toi pour discuter avec les joueurs de tes matchs.');
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      const TabHeader('Chat', subtitle: 'Une conversation par match'),
      Expanded(
        child: Loader<List<Conversation>>(
          load: scope.api.conversations,
          empty: const EmptyState(icon: Icons.forum_outlined, title: 'Pas encore de conversation', message: 'Crée ou rejoins un match.'),
          builder: (context, list, _) => ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, i) {
              final c = list[i];
              return Card(
                child: ListTile(
                  leading: const CircleAvatar(backgroundColor: Brand.surface2, child: Icon(Icons.sports_soccer, color: Brand.lime)),
                  title: Text('Match · ${c.members} joueur${c.members > 1 ? 's' : ''}'),
                  subtitle: Text(c.lastMessage ?? 'Aucun message', maxLines: 1, overflow: TextOverflow.ellipsis),
                  trailing: c.lastMessageAt == null ? null : Text(dakarTime(c.lastMessageAt!), style: const TextStyle(color: Brand.muted)),
                  onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => ConversationPage(conversationId: c.id))),
                ),
              );
            },
          ),
        ),
      ),
    ]);
  }
}

/// Conversation d'un match : historique en REST, nouveaux messages en temps réel par WebSocket.
class ConversationPage extends StatefulWidget {
  const ConversationPage({super.key, this.conversationId, this.matchId});

  const ConversationPage.forMatch(String this.matchId, {super.key}) : conversationId = null;

  final String? conversationId;
  final String? matchId;

  @override
  State<ConversationPage> createState() => _ConversationPageState();
}

class _ConversationPageState extends State<ConversationPage> {
  final _messages = <ChatMessage>[];
  final _input = TextEditingController();
  final _scroll = ScrollController();
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _sub;
  String? _conversationId;
  String? _error;
  bool _live = false;
  bool _started = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_started) {
      _started = true;
      _open();
    }
  }

  Future<void> _open() async {
    final scope = AppScope.of(context);
    try {
      var id = widget.conversationId;
      // La conversation d'un match tout juste créé arrive via Kafka : quelques secondes de patience.
      for (var attempt = 0; id == null && attempt < 10; attempt++) {
        try {
          id = await scope.api.conversationForMatch(widget.matchId!);
        } on Exception {
          await Future<void>.delayed(const Duration(milliseconds: 1500));
        }
      }
      if (id == null) throw Exception('Conversation indisponible pour ce match');
      final history = await scope.api.messages(id);
      final token = await scope.session.token();
      if (!mounted) return;
      setState(() {
        _conversationId = id;
        _messages
          ..clear()
          ..addAll(history);
      });
      _scrollToEnd();
      final channel = WebSocketChannel.connect(Uri.parse(
          AppConfig.wsUrl('/api/v1/chat/ws?conversationId=$id&access_token=${Uri.encodeQueryComponent(token ?? '')}')));
      _channel = channel;
      await channel.ready;
      if (mounted) setState(() => _live = true);
      _sub = channel.stream.listen(
        (raw) => _add(ChatMessage.fromJson(jsonDecode(raw as String) as Map<String, dynamic>)),
        onDone: _offline,
        onError: (Object _) => _offline(),
      );
    } on Exception catch (e) {
      if (mounted) setState(() => _error = '$e');
    }
  }

  void _offline() {
    if (mounted) setState(() => _live = false);
  }

  void _add(ChatMessage m) {
    if (!mounted || _messages.any((x) => x.id == m.id)) return;
    setState(() => _messages.add(m));
    _scrollToEnd();
  }

  void _scrollToEnd() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
      });

  Future<void> _send() async {
    final text = _input.text.trim();
    final id = _conversationId;
    if (text.isEmpty || id == null) return;
    final api = AppScope.of(context).api;
    final sent = await runAction(context, () => api.send(id, text));
    if (sent != null) {
      _input.clear();
      _add(sent);
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    _channel?.sink.close();
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final me = AppScope.of(context).session.user?.id;
    return Scaffold(
      appBar: AppBar(title: const Text('Conversation du match'), actions: [
        Padding(padding: const EdgeInsets.only(right: 12), child: Pill(_live ? 'Temps réel' : 'Hors ligne', color: _live ? Brand.lime : Brand.muted)),
      ]),
      body: _error != null
          ? ErrorView(message: _error!)
          : Column(children: [
              Expanded(
                child: _conversationId == null
                    ? const Center(child: CircularProgressIndicator())
                    : ListView.builder(
                        controller: _scroll,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, i) => _Bubble(message: _messages[i], mine: _messages[i].senderId == me),
                      ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                  child: Row(children: [
                    Expanded(
                      child: TextField(
                        controller: _input,
                        maxLength: 1000,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _send(),
                        decoration: const InputDecoration(hintText: 'Écrire un message…', counterText: ''),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton.filled(onPressed: _send, icon: const Icon(Icons.send_rounded), tooltip: 'Envoyer'),
                  ]),
                ),
              ),
            ]),
    );
  }
}

class _Bubble extends StatelessWidget {
  const _Bubble({required this.message, required this.mine});

  final ChatMessage message;
  final bool mine;

  @override
  Widget build(BuildContext context) => Align(
        alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
          decoration: BoxDecoration(color: mine ? Brand.lime : Brand.surface2, borderRadius: BorderRadius.circular(14)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            if (!mine)
              Text(message.senderName ?? 'Joueur·se', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Brand.muted)),
            Text(message.body, style: TextStyle(color: mine ? Brand.onLime : null)),
            Align(
              alignment: Alignment.centerRight,
              child: Text(dakarTime(message.sentAt), style: TextStyle(fontSize: 10, color: mine ? Brand.onLime.withValues(alpha: 0.6) : Brand.muted)),
            ),
          ]),
        ),
      );
}
