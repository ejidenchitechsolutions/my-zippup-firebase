import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:vibration/vibration.dart';

import '../../core/services/firebase_service.dart';
import '../../core/constants/app_constants.dart';
import '../providers/location_provider.dart';

class EmergencyButton extends ConsumerStatefulWidget {
  const EmergencyButton({super.key});

  @override
  ConsumerState<EmergencyButton> createState() => _EmergencyButtonState();
}

class _EmergencyButtonState extends ConsumerState<EmergencyButton>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _scaleController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _scaleAnimation;
  
  bool _isPressed = false;
  bool _isActivating = false;

  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.3,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.95,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: Curves.easeInOut,
    ));

    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _scaleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) {
        setState(() => _isPressed = true);
        _scaleController.forward();
        _vibrate();
      },
      onTapUp: (_) {
        setState(() => _isPressed = false);
        _scaleController.reverse();
        _showEmergencyDialog();
      },
      onTapCancel: () {
        setState(() => _isPressed = false);
        _scaleController.reverse();
      },
      child: AnimatedBuilder(
        animation: Listenable.merge([_pulseAnimation, _scaleAnimation]),
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.red.withOpacity(0.3 * _pulseAnimation.value),
                    blurRadius: 20 * _pulseAnimation.value,
                    spreadRadius: 5 * _pulseAnimation.value,
                  ),
                ],
              ),
              child: const Icon(
                Icons.emergency,
                color: Colors.red,
                size: 30,
              ),
            ),
          );
        },
      ),
    );
  }

  void _vibrate() async {
    if (await Vibration.hasVibrator() == true) {
      Vibration.vibrate(duration: 100);
    }
  }

  void _showEmergencyDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => EmergencyConfirmationDialog(
        onConfirm: _activateEmergency,
        onCancel: () => Navigator.of(context).pop(),
      ),
    );
  }

  Future<void> _activateEmergency() async {
    if (_isActivating) return;
    
    setState(() => _isActivating = true);
    Navigator.of(context).pop(); // Close dialog

    try {
      // Get current location
      final location = ref.read(locationProvider);
      
      if (location.value == null) {
        _showErrorSnackBar('Unable to get your location. Please try again.');
        return;
      }

      // Show loading dialog
      _showLoadingDialog();

      // Activate panic button
      final result = await FirebaseService.panicButton({
        'latitude': location.value!.latitude,
        'longitude': location.value!.longitude,
        'address': location.value!.address,
        'city': location.value!.city,
        'state': location.value!.state,
        'country': location.value!.country,
      }, 'Emergency assistance needed - Panic button activated');

      Navigator.of(context).pop(); // Close loading dialog

      if (result['success'] == true) {
        _showSuccessDialog();
      } else {
        _showErrorSnackBar(result['error'] ?? 'Failed to activate emergency services');
      }
    } catch (e) {
      Navigator.of(context).pop(); // Close loading dialog
      _showErrorSnackBar('Error: ${e.toString()}');
    } finally {
      setState(() => _isActivating = false);
    }
  }

  void _showLoadingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Activating emergency services...'),
          ],
        ),
      ),
    );
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 28),
            SizedBox(width: 12),
            Text('Emergency Activated'),
          ],
        ),
        content: const Text(
          'Emergency services have been notified and are on their way. Stay safe and keep your phone nearby.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Navigate to emergency tracking screen
              _navigateToEmergencyTracking();
            },
            child: const Text('Track Response'),
          ),
        ],
      ),
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'Retry',
          textColor: Colors.white,
          onPressed: _activateEmergency,
        ),
      ),
    );
  }

  void _navigateToEmergencyTracking() {
    // Navigate to emergency tracking screen
    // Navigator.pushNamed(context, '/emergency-tracking');
  }
}

class EmergencyConfirmationDialog extends StatefulWidget {
  final VoidCallback onConfirm;
  final VoidCallback onCancel;

  const EmergencyConfirmationDialog({
    super.key,
    required this.onConfirm,
    required this.onCancel,
  });

  @override
  State<EmergencyConfirmationDialog> createState() => _EmergencyConfirmationDialogState();
}

class _EmergencyConfirmationDialogState extends State<EmergencyConfirmationDialog>
    with TickerProviderStateMixin {
  late AnimationController _countdownController;
  late Animation<double> _countdownAnimation;
  
  int _countdown = 5;
  bool _isCountingDown = false;

  @override
  void initState() {
    super.initState();
    
    _countdownController = AnimationController(
      duration: const Duration(seconds: 5),
      vsync: this,
    );
    
    _countdownAnimation = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(
      parent: _countdownController,
      curve: Curves.linear,
    ));
  }

  @override
  void dispose() {
    _countdownController.dispose();
    super.dispose();
  }

  void _startCountdown() {
    setState(() => _isCountingDown = true);
    
    _countdownController.forward();
    
    // Update countdown number
    _countdownController.addListener(() {
      final newCountdown = (5 * (1 - _countdownController.value)).ceil();
      if (newCountdown != _countdown && newCountdown > 0) {
        setState(() => _countdown = newCountdown);
        _vibrate();
      }
    });
    
    _countdownController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onConfirm();
      }
    });
  }

  void _vibrate() async {
    if (await Vibration.hasVibrator() == true) {
      Vibration.vibrate(duration: 50);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      title: const Row(
        children: [
          Icon(Icons.warning, color: Colors.red, size: 28),
          SizedBox(width: 12),
          Text('Emergency Alert'),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'This will immediately notify emergency services and your emergency contacts.',
            style: TextStyle(fontSize: 16),
          ),
          const SizedBox(height: 20),
          if (_isCountingDown) ...[
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 80,
                  height: 80,
                  child: AnimatedBuilder(
                    animation: _countdownAnimation,
                    builder: (context, child) {
                      return CircularProgressIndicator(
                        value: _countdownAnimation.value,
                        strokeWidth: 6,
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Colors.red.shade600,
                        ),
                      );
                    },
                  ),
                ),
                Text(
                  _countdown.toString(),
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Activating emergency services...',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ] else ...[
            const Text(
              'Are you sure you want to activate emergency services?',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
          ],
        ],
      ),
      actions: _isCountingDown
          ? [
              TextButton(
                onPressed: () {
                  _countdownController.stop();
                  widget.onCancel();
                },
                child: const Text('CANCEL'),
              ),
            ]
          : [
              TextButton(
                onPressed: widget.onCancel,
                child: const Text('Cancel'),
              ),
              ElevatedButton(
                onPressed: _startCountdown,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                child: const Text('ACTIVATE'),
              ),
            ],
    );
  }
}