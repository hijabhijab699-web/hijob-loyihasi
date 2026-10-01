// Registers the Swift AppleFaceDetectorPlugin with Vision Camera's frame
// processor registry at app launch (via +load). After registration, JS can
// initialise it with:
//   VisionCameraProxy.initFrameProcessorPlugin('detectFaceApple')

#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

// The Swift class produced by the Swift compiler — the generated interface
// header depends on the pod's module name and how the target is built.
// Try each candidate; whichever imports lets us call [AppleFaceDetectorPlugin alloc].
#if __has_include(<AppleFaceDetector/AppleFaceDetector-Swift.h>)
#import <AppleFaceDetector/AppleFaceDetector-Swift.h>
#elif __has_include("AppleFaceDetector-Swift.h")
#import "AppleFaceDetector-Swift.h"
#endif

@interface AppleFaceDetectorPlugin (FrameProcessorPluginLoader)
@end

@implementation AppleFaceDetectorPlugin (FrameProcessorPluginLoader)

+ (void)load {
  [FrameProcessorPluginRegistry addFrameProcessorPlugin:@"detectFaceApple"
    withInitializer:^FrameProcessorPlugin* _Nonnull (VisionCameraProxyHolder* _Nonnull proxy, NSDictionary* _Nullable options) {
      return [[AppleFaceDetectorPlugin alloc] initWithProxy:proxy withOptions:options];
    }];
}

@end
