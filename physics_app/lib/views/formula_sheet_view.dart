import 'package:flutter/material.dart';

/// View for browsing the physics formula library.
class FormulaSheetView extends StatefulWidget {
  const FormulaSheetView({super.key});

  @override
  State<FormulaSheetView> createState() => _FormulaSheetViewState();
}

class _FormulaSheetViewState extends State<FormulaSheetView> {
  String _selectedTopic = 'All';
  final _searchController = TextEditingController();

  static const _topics = [
    'All', 'Kinematics', 'Dynamics', 'Energy', 'Momentum', 'Waves', 'Electricity'
  ];

  // Simplified formula data
  static const _formulas = [
    _FormulaItem(
      name: 'Constant Velocity',
      latex: r'v = \frac{\Delta x}{\Delta t}',
      description: 'Velocity equals displacement divided by time',
      topic: 'Kinematics',
      variables: 'v, Δx, Δt',
    ),
    _FormulaItem(
      name: 'Uniform Acceleration',
      latex: r'a = \frac{v - v_0}{t}',
      description: 'Acceleration equals change in velocity divided by time',
      topic: 'Kinematics',
      variables: 'a, v, v₀, t',
    ),
    _FormulaItem(
      name: 'Displacement (UA)',
      latex: r'\Delta x = v_0 t + \frac{1}{2} a t^2',
      description: 'Displacement under constant acceleration',
      topic: 'Kinematics',
      variables: 'Δx, v₀, a, t',
    ),
    _FormulaItem(
      name: 'Free Fall',
      latex: r'h = \frac{1}{2} g t^2',
      description: 'Distance fallen from rest under gravity',
      topic: 'Kinematics',
      variables: 'h, g, t',
    ),
    _FormulaItem(
      name: "Newton's Second Law",
      latex: r'F = m a',
      description: 'Net force equals mass times acceleration',
      topic: 'Dynamics',
      variables: 'F, m, a',
    ),
    _FormulaItem(
      name: 'Friction Force',
      latex: r'f = \mu N',
      description: 'Friction equals coefficient times normal force',
      topic: 'Dynamics',
      variables: 'f, μ, N',
    ),
    _FormulaItem(
      name: 'Centripetal Force',
      latex: r'F_c = \frac{m v^2}{r}',
      description: 'Centripetal force for circular motion',
      topic: 'Dynamics',
      variables: 'Fc, m, v, r',
    ),
    _FormulaItem(
      name: 'Kinetic Energy',
      latex: r'E_k = \frac{1}{2} m v^2',
      description: 'Kinetic energy of a moving object',
      topic: 'Energy',
      variables: 'Ek, m, v',
    ),
    _FormulaItem(
      name: 'Potential Energy',
      latex: r'E_p = m g h',
      description: 'Gravitational potential energy',
      topic: 'Energy',
      variables: 'Ep, m, g, h',
    ),
    _FormulaItem(
      name: 'Work',
      latex: r'W = F d \cos\theta',
      description: 'Work equals force times displacement times cos(θ)',
      topic: 'Energy',
      variables: 'W, F, d, θ',
    ),
    _FormulaItem(
      name: 'Momentum',
      latex: r'p = m v',
      description: 'Momentum equals mass times velocity',
      topic: 'Momentum',
      variables: 'p, m, v',
    ),
    _FormulaItem(
      name: 'Impulse',
      latex: r'J = F \Delta t = \Delta p',
      description: 'Impulse equals change in momentum',
      topic: 'Momentum',
      variables: 'J, F, Δt, Δp',
    ),
    _FormulaItem(
      name: 'Wave Speed',
      latex: r'v = f \lambda',
      description: 'Wave speed equals frequency times wavelength',
      topic: 'Waves',
      variables: 'v, f, λ',
    ),
    _FormulaItem(
      name: "Ohm's Law",
      latex: r'V = I R',
      description: 'Voltage equals current times resistance',
      topic: 'Electricity',
      variables: 'V, I, R',
    ),
    _FormulaItem(
      name: 'Electric Power',
      latex: r'P = V I = I^2 R',
      description: 'Electric power formulas',
      topic: 'Electricity',
      variables: 'P, V, I, R',
    ),
  ];

  List<_FormulaItem> get _filteredFormulas {
    var items = _formulas;
    if (_selectedTopic != 'All') {
      items = items.where((f) => f.topic == _selectedTopic).toList();
    }
    final query = _searchController.text.toLowerCase();
    if (query.isNotEmpty) {
      items = items.where((f) =>
        f.name.toLowerCase().contains(query) ||
        f.description.toLowerCase().contains(query) ||
        f.topic.toLowerCase().contains(query)
      ).toList();
    }
    return items;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Formula Sheet'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search formulas...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _topics.length,
              itemBuilder: (context, index) {
                final topic = _topics[index];
                final isSelected = topic == _selectedTopic;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(topic),
                    selected: isSelected,
                    onSelected: (_) => setState(() => _selectedTopic = topic),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _filteredFormulas.length,
              itemBuilder: (context, index) {
                final formula = _filteredFormulas[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ExpansionTile(
                    leading: CircleAvatar(
                      backgroundColor: theme.colorScheme.primaryContainer,
                      child: Text(
                        formula.topic[0],
                        style: TextStyle(color: theme.colorScheme.onPrimaryContainer),
                      ),
                    ),
                    title: Text(formula.name, style: theme.textTheme.titleSmall),
                    subtitle: Text(formula.topic, style: theme.textTheme.bodySmall),
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.surfaceContainerHighest,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                formula.latex,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontStyle: FontStyle.italic,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(formula.description, style: theme.textTheme.bodyMedium),
                            const SizedBox(height: 8),
                            Text(
                              'Variables: ${formula.variables}',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _FormulaItem {
  final String name;
  final String latex;
  final String description;
  final String topic;
  final String variables;

  const _FormulaItem({
    required this.name,
    required this.latex,
    required this.description,
    required this.topic,
    required this.variables,
  });
}