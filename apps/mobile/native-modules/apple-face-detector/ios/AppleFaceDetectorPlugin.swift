// Apple Vision face detector frame-processor plugin.
//
// Runs VNDetectFaceLandmarksRequest against each Vision Camera frame and
// returns the top face's bounding box and 60-ish contour points. Zero
// third-party dependencies — the Vision framework is built into iOS 13+
// and its arm64-simulator slice ships with Xcode by default.
//
// Returned shape per detected face:
//   {
//     bounds: { x, y, width, height },      // frame pixels, top-left origin
//     contour: [{ x, y }, ...]              // face oval + jawline pixels
//   }

import Foundation
import Vision
import CoreMedia
import VisionCamera

@objc(AppleFaceDetectorPlugin)
public class AppleFaceDetectorPlugin: FrameProcessorPlugin {

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable : Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable : Any]?) -> Any? {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else {
      return []
    }

    let request = VNDetectFaceLandmarksRequest()
    // .fast — Vision picks a lighter model, ~2x faster with a small
    // accuracy hit; we only need coarse contour to shape the scarf.
    if #available(iOS 15.0, *) {
      request.revision = VNDetectFaceLandmarksRequestRevision3
    }

    let handler = VNImageRequestHandler(
      cvPixelBuffer: pixelBuffer,
      orientation: orientationFor(frame),
      options: [:]
    )

    do {
      try handler.perform([request])
    } catch {
      return []
    }

    guard let faces = request.results, !faces.isEmpty else {
      return []
    }

    let fw = CGFloat(frame.width)
    let fh = CGFloat(frame.height)

    return faces.map { face -> [String: Any] in
      // Vision returns normalized coords, origin at bottom-left. Convert
      // to top-left pixel space so JS matches Skia's coord system.
      let bb = face.boundingBox
      let boundsX = bb.origin.x * fw
      let boundsW = bb.size.width * fw
      let boundsH = bb.size.height * fh
      let boundsY = (1.0 - bb.origin.y - bb.size.height) * fh

      var contour: [[String: Any]] = []
      let imageSize = CGSize(width: fw, height: fh)
      if let region = face.landmarks?.faceContour {
        let pts = region.pointsInImage(imageSize: imageSize)
        for p in pts {
          contour.append([
            "x": Double(p.x),
            "y": Double(fh - p.y),
          ])
        }
      }

      return [
        "bounds": [
          "x": Double(boundsX),
          "y": Double(boundsY),
          "width": Double(boundsW),
          "height": Double(boundsH),
        ],
        "contour": contour,
      ]
    }
  }

  /// Vision Camera reports the frame's `orientation` via a UIImage.Orientation
  /// (Int-backed enum). Map to Vision's CGImagePropertyOrientation.
  private func orientationFor(_ frame: Frame) -> CGImagePropertyOrientation {
    switch frame.orientation {
    case .up:            return .up
    case .down:          return .down
    case .left:          return .left
    case .right:         return .right
    case .upMirrored:    return .upMirrored
    case .downMirrored:  return .downMirrored
    case .leftMirrored:  return .leftMirrored
    case .rightMirrored: return .rightMirrored
    @unknown default:    return .up
    }
  }
}
