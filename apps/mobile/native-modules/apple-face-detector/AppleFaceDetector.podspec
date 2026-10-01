require 'json'
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'AppleFaceDetector'
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = 'https://n2431.app'
  s.license      = { :type => 'MIT' }
  s.author       = { 'N24:31' => 'dev@n2431.app' }
  s.platforms    = { :ios => '13.0' }
  s.source       = { :git => 'https://n2431.app/plugins/apple-face-detector.git', :tag => s.version.to_s }
  s.source_files = 'ios/**/*.{h,m,mm,swift}'

  s.dependency 'React-Core'
  s.dependency 'VisionCamera'

  s.swift_version = '5.0'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }
end
