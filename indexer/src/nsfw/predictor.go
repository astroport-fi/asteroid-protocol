package nsfw

import (
	"bytes"
	"fmt"
	"image/png"

	tf "github.com/galeone/tensorflow/tensorflow/go"
	"github.com/galeone/tensorflow/tensorflow/go/op"
	tg "github.com/galeone/tfgo"
	"golang.org/x/image/webp"
)

const (
	ImageDimensions = 224
)

type Predictor struct {
	model *tg.Model
}

type Prediction struct {
	Drawings float32
	Hentai   float32
	Neutral  float32
	Porn     float32
	Sexy     float32
}

func NewPredictor(model *tg.Model) *Predictor {
	return &Predictor{
		model: model,
	}
}

func NewPredictorFromPath(modelPath string) (*Predictor, error) {
	model := tg.LoadModel(modelPath, []string{"serve"}, nil)
	return NewPredictor(model), nil
}

func (p *Predictor) Predict(img []byte, imageFormat string) (*Prediction, error) {
	tensor, err := createTensorFromImage(img, imageFormat)
	if err != nil {
		return nil, err
	}

	results := p.model.Exec([]tf.Output{
		p.model.Op("StatefulPartitionedCall", 0),
	}, map[tf.Output]*tf.Tensor{
		p.model.Op("serving_default_input", 0): tensor,
	})

	vals := results[0].Value().([][]float32)[0]
	return &Prediction{
		Drawings: vals[0],
		Hentai:   vals[1],
		Neutral:  vals[2],
		Porn:     vals[3],
		Sexy:     vals[4],
	}, nil
}

func (p Prediction) Describe() string {
	return fmt.Sprintf(
		"[Drawing: %.2f%% , Hentai: %.2f%%, Porn: %.2f%%, Sexy: %.2f%%, Neutral: %.2f%%]",
		p.Drawings*100, p.Hentai*100, p.Porn*100, p.Sexy*100, p.Neutral*100)
}

func (p Prediction) IsNSFW() bool {
	if p.Porn > 0.3 {
		return true
	}
	if p.Sexy > 0.4 {
		return true
	}
	if p.Hentai > 0.3 {
		return true
	}

	return false
}

type Image struct {
	Path   *op.Scope
	Input  tf.Output
	Output tf.Output
}

func (image *Image) Scale(min, max float32) *Image {
	if image.Output.DataType() != tf.Float {
		image.Output = tg.Cast(image.Path, image.Output, tf.Float)
	}

	scaleScope := image.Path.SubScope("scale")

	minVal := op.Min(scaleScope.SubScope("Min"), image.Output, op.Const(scaleScope.SubScope("reductionIndices"), []int32{0, 1, 2}), op.MinKeepDims(false))
	maxVal := op.Max(scaleScope.SubScope("Max"), image.Output, op.Const(scaleScope.SubScope("reductionIndices"), []int32{0, 1, 2}), op.MaxKeepDims(false))
	image.Output = op.Div(scaleScope.SubScope("Div"),
		op.Mul(scaleScope.SubScope("Mul"),
			op.Sub(scaleScope.SubScope("Sub"), image.Output, minVal),
			op.Const(scaleScope.SubScope("scaleRange"), max-min)),
		op.Sub(scaleScope.SubScope("Sub"), maxVal, minVal))
	return image
}

func (image *Image) Resize(width, height int32) *Image {
	resizeScope := image.Path.SubScope("resizeArea")
	image.Output = op.ResizeArea(resizeScope.SubScope("ResizeArea"), image.Output, op.Const(resizeScope.SubScope("size"), []int32{width, height}))
	return image
}

func NewImage(imageFormat string) *Image {
	s := op.NewScope()
	input := op.Placeholder(s, tf.String)

	var decode tf.Output
	if imageFormat == "png" {
		decode = op.DecodePng(s, input, op.DecodePngChannels(3))
	} else if imageFormat == "gif" {
		decode = op.DecodeGif(s, input)
	} else if imageFormat == "bmp" {
		decode = op.DecodeBmp(s, input, op.DecodeBmpChannels(3))
	} else if imageFormat == "jpeg" || imageFormat == "jpg" || imageFormat == "jpe" {
		decode = op.DecodeJpeg(s.SubScope("DecodeJpeg"), input, op.DecodeJpegChannels(3))
	} else {
		return nil
	}

	output := op.ExpandDims(s.SubScope("ExpandDims"), decode, op.Const(s.SubScope("axis"), []int32{0}))

	img := &Image{Path: s, Output: op.Identity(s.SubScope("Identity"), output), Input: input}
	img.Scale(0, 1)
	return img
}

func webpToPng(image []byte) ([]byte, error) {
	img, err := webp.Decode(bytes.NewReader(image))
	if err != nil {
		return nil, err
	}
	buf := new(bytes.Buffer)
	err = png.Encode(buf, img)
	if err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func createTensorFromImage(image []byte, imageFormat string) (*tf.Tensor, error) {
	var err error
	if imageFormat == "webp" {
		image, err = webpToPng(image)
		if err != nil {
			return nil, err
		}
		imageFormat = "png"
	}
	tensor, err := tf.NewTensor(string(image))
	if err != nil {
		return nil, err
	}

	img := NewImage(imageFormat)
	if img == nil {
		return nil, fmt.Errorf("unknown image format %s", imageFormat)
	}
	img.Resize(ImageDimensions, ImageDimensions)

	graph, err := img.Path.Finalize()

	if err != nil {
		return nil, err
	}
	session, err := tf.NewSession(graph, nil)
	if err != nil {
		return nil, err
	}
	defer session.Close()
	normalized, err := session.Run(
		map[tf.Output]*tf.Tensor{img.Input: tensor},
		[]tf.Output{img.Output},
		nil)
	if err != nil {
		return nil, err
	}
	return normalized[0], nil
}
